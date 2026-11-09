"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AppError, errorMessage } from "@/lib/errors";
import {
  BOOKING_STATUS,
  CANCELLATION_HOURS,
  STAFF_ROLES,
  type Role,
} from "@/lib/constants";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function bookTraining(trainingId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Войдите, чтобы записаться" };

  try {
    await prisma.$transaction(async (tx) => {
      const training = await tx.training.findUnique({
        where: { id: trainingId },
      });

      if (!training || training.status !== "SCHEDULED") {
        throw new AppError("Тренировка недоступна");
      }
      if (training.startsAt.getTime() <= Date.now()) {
        throw new AppError("Тренировка уже началась");
      }

      const active = await tx.booking.count({
        where: { trainingId, status: BOOKING_STATUS.ACTIVE },
      });
      if (active >= training.capacity) {
        throw new AppError("Свободных мест нет");
      }

      const existing = await tx.booking.findUnique({
        where: {
          userId_trainingId: { userId: session.userId, trainingId },
        },
      });
      if (existing?.status === BOOKING_STATUS.ACTIVE) {
        throw new AppError("Вы уже записаны на эту тренировку");
      }

      let subscription = null;
      if (training.priceCents > 0) {
        subscription = await tx.subscription.findFirst({
          where: {
            userId: session.userId,
            status: "ACTIVE",
            left: { gt: 0 },
            validUntil: { gt: new Date() },
          },
          orderBy: { validUntil: "asc" },
        });
        if (!subscription) {
          throw new AppError("Нужен действующий абонемент");
        }
      }

      const qrToken = randomUUID();

      if (existing) {
        await tx.booking.update({
          where: { id: existing.id },
          data: {
            status: BOOKING_STATUS.ACTIVE,
            qrToken,
            cancelledAt: null,
            cancelReason: null,
            checkedInAt: null,
          },
        });
      } else {
        await tx.booking.create({
          data: { userId: session.userId, trainingId, qrToken },
        });
      }

      if (subscription) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { left: { decrement: 1 } },
        });
      }

      await tx.notification.create({
        data: {
          userId: session.userId,
          channel: "IN_APP",
          event: "BOOKING_CONFIRMED",
          payload: JSON.stringify({
            trainingId,
            title: training.title,
          }),
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/my");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Не удалось записаться") };
  }
}

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Войдите, чтобы управлять записью" };

  try {
    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { training: true },
      });

      if (!booking) throw new AppError("Запись не найдена");

      const isStaff = STAFF_ROLES.includes(session.role as Role);
      if (booking.userId !== session.userId && !isStaff) {
        throw new AppError("Нет доступа к этой записи");
      }
      if (booking.status !== BOOKING_STATUS.ACTIVE) {
        throw new AppError("Запись уже отменена");
      }

      const hoursLeft =
        (booking.training.startsAt.getTime() - Date.now()) / 3_600_000;

      if (!isStaff && hoursLeft < CANCELLATION_HOURS) {
        throw new AppError(
          `Отменить можно не позднее чем за ${CANCELLATION_HOURS} ч до начала`,
        );
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BOOKING_STATUS.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: isStaff ? "Отменено сотрудником" : "Отменено клиентом",
        },
      });

      if (booking.training.priceCents > 0) {
        const subscription = await tx.subscription.findFirst({
          where: { userId: booking.userId },
          orderBy: { createdAt: "desc" },
        });
        if (subscription) {
          await tx.subscription.update({
            where: { id: subscription.id },
            data: { left: { increment: 1 } },
          });
        }
      }

      await tx.notification.create({
        data: {
          userId: booking.userId,
          channel: "IN_APP",
          event: "BOOKING_CANCELLED",
          payload: JSON.stringify({
            trainingId: booking.trainingId,
            title: booking.training.title,
          }),
        },
      });
    });

    revalidatePath("/");
    revalidatePath("/my");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Не удалось отменить запись") };
  }
}

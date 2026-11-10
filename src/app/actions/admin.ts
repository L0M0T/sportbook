"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isStaffRole } from "@/lib/access";
import { AppError, errorMessage } from "@/lib/errors";
import { BOOKING_STATUS, ROLES, type Role } from "@/lib/constants";

export type FormState = {
  ok: boolean;
  error?: string;
  message?: string;
};

async function requireStaffAction() {
  const session = await getSession();
  if (!session) throw new AppError("Нужно войти");
  if (!isStaffRole(session.role)) throw new AppError("Недостаточно прав");
  return session;
}

const trainingSchema = z.object({
  title: z.string().trim().min(2, "Укажите название").max(120),
  direction: z.string().trim().min(2, "Укажите направление").max(60),
  type: z.enum(["GROUP", "PERSONAL"]),
  trainerId: z.string().min(1, "Выберите тренера"),
  roomId: z.string().min(1, "Выберите зал"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Укажите время"),
  durationMin: z.coerce.number().int().min(15).max(240),
  capacity: z.coerce.number().int().min(1).max(60),
  price: z.coerce.number().int().min(0).max(100_000),
});

export async function createTraining(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const session = await requireStaffAction();
    const parsed = trainingSchema.safeParse({
      title: formData.get("title"),
      direction: formData.get("direction"),
      type: formData.get("type"),
      trainerId: formData.get("trainerId"),
      roomId: formData.get("roomId"),
      date: formData.get("date"),
      time: formData.get("time"),
      durationMin: formData.get("durationMin"),
      capacity: formData.get("capacity"),
      price: formData.get("price"),
    });

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Проверьте поля",
      };
    }

    const data = parsed.data;
    // Время вводится по Москве (UTC+3, без перехода на летнее время).
    const startsAt = new Date(`${data.date}T${data.time}:00+03:00`);
    if (Number.isNaN(startsAt.getTime())) {
      return { ok: false, error: "Некорректная дата или время" };
    }
    if (startsAt.getTime() <= Date.now()) {
      return { ok: false, error: "Тренировка должна быть в будущем" };
    }

    const [trainer, room] = await Promise.all([
      prisma.trainer.findUnique({ where: { id: data.trainerId } }),
      prisma.room.findUnique({ where: { id: data.roomId } }),
    ]);
    if (!trainer) return { ok: false, error: "Тренер не найден" };
    if (!room) return { ok: false, error: "Зал не найден" };

    const training = await prisma.$transaction(async (tx) => {
      const created = await tx.training.create({
        data: {
          title: data.title,
          direction: data.direction,
          type: data.type,
          trainerId: data.trainerId,
          roomId: data.roomId,
          startsAt,
          durationMin: data.durationMin,
          capacity: data.capacity,
          priceCents: data.price * 100,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: "TRAINING_CREATED",
          entity: "Training",
          entityId: created.id,
          after: JSON.stringify({
            title: created.title,
            startsAt: created.startsAt,
            capacity: created.capacity,
          }),
        },
      });

      return created;
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/schedule");

    return {
      ok: true,
      message: `Тренировка «${training.title}» создана`,
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Не удалось создать тренировку") };
  }
}

export async function cancelTraining(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const trainingId = String(formData.get("trainingId") ?? "");

  try {
    const session = await requireStaffAction();

    const result = await prisma.$transaction(async (tx) => {
      const training = await tx.training.findUnique({
        where: { id: trainingId },
        include: {
          bookings: { where: { status: BOOKING_STATUS.ACTIVE } },
        },
      });

      if (!training) throw new AppError("Тренировка не найдена");
      if (training.status === "CANCELLED") {
        throw new AppError("Тренировка уже отменена");
      }

      await tx.training.update({
        where: { id: trainingId },
        data: { status: "CANCELLED" },
      });

      let refunded = 0;
      for (const booking of training.bookings) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BOOKING_STATUS.CANCELLED,
            cancelledAt: new Date(),
            cancelReason: "Тренировка отменена администратором",
          },
        });

        if (training.priceCents > 0) {
          const subscription = await tx.subscription.findFirst({
            where: { userId: booking.userId, status: "ACTIVE" },
            orderBy: { validUntil: "desc" },
          });
          if (subscription) {
            await tx.subscription.update({
              where: { id: subscription.id },
              data: { left: { increment: 1 } },
            });
            refunded += 1;
          }
        }

        await tx.notification.create({
          data: {
            userId: booking.userId,
            channel: "IN_APP",
            event: "TRAINING_CANCELLED",
            status: "SENT",
            sentAt: new Date(),
            payload: JSON.stringify({
              trainingId: training.id,
              title: training.title,
              startsAt: training.startsAt,
            }),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: "TRAINING_CANCELLED",
          entity: "Training",
          entityId: training.id,
          before: JSON.stringify({ status: training.status }),
          after: JSON.stringify({
            status: "CANCELLED",
            affectedBookings: training.bookings.length,
            refundedLessons: refunded,
          }),
        },
      });

      return {
        affected: training.bookings.length,
        refunded,
        title: training.title,
      };
    });

    revalidatePath("/");
    revalidatePath("/my");
    revalidatePath("/admin");
    revalidatePath("/admin/schedule");

    return {
      ok: true,
      message: `«${result.title}» отменена. Записей снято: ${result.affected}, возвращено занятий: ${result.refunded}`,
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Не удалось отменить тренировку") };
  }
}

const checkinSchema = z.object({
  code: z.string().trim().min(4, "Введите код записи"),
});

export async function checkInBooking(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const session = await requireStaffAction();
    const parsed = checkinSchema.safeParse({ code: formData.get("code") });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверьте код" };
    }

    const code = parsed.data.code;

    const booking = await prisma.booking.findFirst({
      where: { OR: [{ qrToken: code }, { id: code }] },
      include: {
        user: true,
        training: { include: { room: true, trainer: true } },
      },
    });

    if (!booking) return { ok: false, error: "Запись не найдена" };
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return { ok: false, error: "Запись отменена" };
    }
    if (booking.status === BOOKING_STATUS.ATTENDED) {
      return {
        ok: false,
        error: `Уже отмечено: ${booking.user.name ?? booking.user.phone}, ${booking.training.title}`,
      };
    }
    if (booking.status === BOOKING_STATUS.NO_SHOW) {
      return { ok: false, error: "Запись помечена как неявка" };
    }

    const startsAt = booking.training.startsAt.getTime();
    const endsAt = startsAt + booking.training.durationMin * 60_000;
    const now = Date.now();
    if (now > endsAt) {
      return { ok: false, error: "Тренировка уже закончилась" };
    }
    if (now < startsAt - 60 * 60_000) {
      return { ok: false, error: "Чек-ин откроется за час до начала" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BOOKING_STATUS.ATTENDED, checkedInAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: "BOOKING_CHECKED_IN",
          entity: "Booking",
          entityId: booking.id,
          after: JSON.stringify({ trainingId: booking.trainingId }),
        },
      });
    });

    revalidatePath("/my");
    revalidatePath("/admin/checkin");

    return {
      ok: true,
      message: `Чек-ин: ${booking.user.name ?? booking.user.phone} · ${booking.training.title} · ${booking.training.room.name}`,
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Не удалось отметить визит") };
  }
}

export async function updateUserRole(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const session = await requireStaffAction();
    if (session.role !== ROLES.ADMIN) {
      return { ok: false, error: "Менять роли может только администратор" };
    }

    const userId = String(formData.get("userId") ?? "");
    const role = String(formData.get("role") ?? "");
    if (!Object.values(ROLES).includes(role as Role)) {
      return { ok: false, error: "Неизвестная роль" };
    }
    if (userId === session.userId) {
      return { ok: false, error: "Нельзя изменить собственную роль" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { ok: false, error: "Пользователь не найден" };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { role } });
      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: "USER_ROLE_CHANGED",
          entity: "User",
          entityId: userId,
          before: JSON.stringify({ role: user.role }),
          after: JSON.stringify({ role }),
        },
      });
    });

    revalidatePath("/admin/users");
    return { ok: true, message: `Роль обновлена: ${user.phone} → ${role}` };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Не удалось изменить роль") };
  }
}

export async function toggleUserBlock(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const session = await requireStaffAction();
    const userId = String(formData.get("userId") ?? "");
    if (userId === session.userId) {
      return { ok: false, error: "Нельзя заблокировать себя" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { ok: false, error: "Пользователь не найден" };
    if (user.role === ROLES.ADMIN && session.role !== ROLES.ADMIN) {
      return { ok: false, error: "Нельзя блокировать администратора" };
    }

    const blocked = user.deletedAt !== null;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: blocked ? null : new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.userId,
          action: blocked ? "USER_UNBLOCKED" : "USER_BLOCKED",
          entity: "User",
          entityId: userId,
          before: JSON.stringify({ deletedAt: user.deletedAt }),
          after: JSON.stringify({ deletedAt: blocked ? null : new Date() }),
        },
      });
    });

    revalidatePath("/admin/users");
    return {
      ok: true,
      message: blocked ? "Пользователь разблокирован" : "Пользователь заблокирован",
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Не удалось изменить доступ") };
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  await prisma.notification.updateMany({
    where: { userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/notifications");
  revalidatePath("/my");
}

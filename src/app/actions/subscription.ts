"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { payment } from "@/lib/providers/payment";
import { AppError, errorMessage } from "@/lib/errors";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function purchaseSubscription(
  planId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Войдите, чтобы оформить абонемент" };
  }

  const plan = getPlan(planId);
  if (!plan) return { ok: false, error: "Тариф не найден" };

  try {
    const result = await payment.pay({
      amountCents: plan.priceCents,
      description: `Абонемент «${plan.name}»`,
    });

    if (!result.ok) throw new AppError("Платёж отклонён");

    await prisma.$transaction(async (tx) => {
      const existing = await tx.subscription.findFirst({
        where: { userId: session.userId, status: "ACTIVE" },
        orderBy: { validUntil: "desc" },
      });

      const subscription = existing
        ? await tx.subscription.update({
            where: { id: existing.id },
            data: {
              left: { increment: plan.lessons },
              total: { increment: plan.lessons },
              validUntil: new Date(
                Math.max(existing.validUntil.getTime(), Date.now()) +
                  plan.days * 86_400_000,
              ),
            },
          })
        : await tx.subscription.create({
            data: {
              userId: session.userId,
              planName: plan.name,
              total: plan.lessons,
              left: plan.lessons,
              validUntil: new Date(Date.now() + plan.days * 86_400_000),
            },
          });

      await tx.payment.create({
        data: {
          userId: session.userId,
          subscriptionId: subscription.id,
          amountCents: plan.priceCents,
          provider: "mock",
          externalId: result.externalId,
          status: "PAID",
          paidAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: session.userId,
          channel: "IN_APP",
          event: "SUBSCRIPTION_PURCHASED",
          payload: JSON.stringify({ plan: plan.name, lessons: plan.lessons }),
        },
      });
    });

    revalidatePath("/my");
    revalidatePath("/subscriptions");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: errorMessage(error, "Не удалось оформить абонемент"),
    };
  }
}

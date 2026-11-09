import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { formatMoney, plural } from "@/lib/format";
import { BuyButton } from "./buy-button";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const session = await getSession();

  const current = session
    ? await prisma.subscription.findFirst({
        where: { userId: session.userId, status: "ACTIVE" },
        orderBy: { validUntil: "desc" },
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Абонементы
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">
            Выберите формат занятий
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            Одно занятие списывается при чек-ине. Отмена за 2 часа и раньше
            возвращает занятие на счёт.
          </p>
        </div>

        {current && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 px-5 py-3 text-sm">
            <p className="text-muted">Сейчас на абонементе</p>
            <p className="mt-0.5 text-lg font-bold text-accent">
              {current.left}{" "}
              {plural(current.left, "занятие", "занятия", "занятий")}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan, index) => {
          const highlighted = index === 2;
          return (
            <div
              key={plan.id}
              className={[
                "flex flex-col rounded-2xl border p-5",
                highlighted
                  ? "border-accent/60 bg-surface-2"
                  : "border-line bg-surface",
              ].join(" ")}
            >
              {highlighted && (
                <span className="mb-2 w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-ink">
                  Хит
                </span>
              )}
              <h2 className="text-lg font-bold">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted">{plan.note}</p>

              <p className="mt-5 text-3xl font-extrabold">
                {formatMoney(plan.priceCents)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {plan.lessons}{" "}
                {plural(plan.lessons, "занятие", "занятия", "занятий")} ·{" "}
                {plan.days} дней
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatMoney(Math.round(plan.priceCents / plan.lessons))} за
                занятие
              </p>

              <div className="mt-auto">
                {session ? (
                  <BuyButton planId={plan.id} />
                ) : (
                  <Link
                    href="/login"
                    className="mt-5 block w-full rounded-xl border border-line px-4 py-2.5 text-center text-sm font-semibold text-muted transition hover:text-ink"
                  >
                    Войти и оформить
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted">
        Демо-режим: оплата имитируется, деньги не списываются. Реальный
        эквайринг подключается заменой платёжного провайдера.
      </p>
    </div>
  );
}

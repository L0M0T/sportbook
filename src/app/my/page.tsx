import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDateTime, formatMoney, plural } from "@/lib/format";
import { CancelButton } from "./cancel-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Записан",
  CANCELLED: "Отменена",
  ATTENDED: "Посещена",
  NO_SHOW: "Неявка",
};

export default async function MyPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [bookings, subscription] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.userId },
      include: {
        training: { include: { trainer: true, room: true } },
      },
      orderBy: { training: { startsAt: "asc" } },
    }),
    prisma.subscription.findFirst({
      where: { userId: session.userId, status: "ACTIVE" },
      orderBy: { validUntil: "desc" },
    }),
  ]);

  const now = Date.now();
  const upcoming = bookings.filter(
    (booking) =>
      booking.status === "ACTIVE" && booking.training.startsAt.getTime() > now,
  );
  const history = bookings.filter(
    (booking) =>
      booking.status !== "ACTIVE" ||
      booking.training.startsAt.getTime() <= now,
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Личный кабинет
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Мои записи</h1>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-line px-4 py-2 text-sm text-muted transition hover:text-ink"
        >
          К расписанию
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Абонемент
          </p>
          {subscription ? (
            <>
              <p className="mt-2 text-2xl font-extrabold">
                {subscription.left}{" "}
                {plural(
                  subscription.left,
                  "занятие",
                  "занятия",
                  "занятий",
                )}
              </p>
              <p className="mt-1 text-sm text-muted">
                {subscription.planName} · действует до{" "}
                {new Intl.DateTimeFormat("ru-RU", {
                  day: "numeric",
                  month: "long",
                }).format(subscription.validUntil)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold">Нет активного</p>
              <p className="mt-1 text-sm text-muted">
                Оформите абонемент, чтобы записываться на платные тренировки.
              </p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Предстоящие
          </p>
          <p className="mt-2 text-2xl font-extrabold">{upcoming.length}</p>
          <p className="mt-1 text-sm text-muted">
            {upcoming.length === 0
              ? "Пока ничего не запланировано"
              : "Не забудьте про QR-код на входе"}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          Предстоящие тренировки
        </h2>

        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <p className="font-semibold">Записей нет</p>
            <p className="mt-1 text-sm text-muted">
              Выберите тренировку в расписании.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
            >
              Открыть расписание
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{booking.training.title}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDateTime(booking.training.startsAt)} ·{" "}
                    {booking.training.trainer.name} ·{" "}
                    {booking.training.room.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {booking.training.priceCents > 0
                      ? formatMoney(booking.training.priceCents)
                      : "Бесплатно"}
                  </p>
                  <p className="text-xs text-muted">QR в приложении</p>
                </div>
                <CancelButton bookingId={booking.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          История
        </h2>

        {history.length === 0 ? (
          <p className="text-sm text-muted">История пока пустая.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
            {history.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">
                  {booking.training.title}
                </span>
                <span className="text-muted">
                  {formatDateTime(booking.training.startsAt)}
                </span>
                <span
                  className={
                    booking.status === "CANCELLED"
                      ? "text-danger"
                      : "text-muted"
                  }
                >
                  {STATUS_LABEL[booking.status] ?? booking.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

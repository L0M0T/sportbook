import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatTime, plural } from "@/lib/format";
import { moscowMidnight } from "@/lib/time";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  TRAINING_CREATED: "Создана тренировка",
  TRAINING_CANCELLED: "Отменена тренировка",
  BOOKING_CHECKED_IN: "Чек-ин по QR",
  USER_ROLE_CHANGED: "Изменена роль",
  USER_BLOCKED: "Пользователь заблокирован",
  USER_UNBLOCKED: "Пользователь разблокирован",
};

export default async function AdminDashboard() {
  const todayStart = moscowMidnight(0);
  const todayEnd = moscowMidnight(1);
  const weekEnd = moscowMidnight(7);
  const monthAgo = new Date(new Date().getTime() - 30 * 86_400_000);

  const [
    clients,
    upcoming,
    todayTrainings,
    activeBookings,
    revenue,
    audit,
    unreadNotifications,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT", deletedAt: null } }),
    prisma.training.count({
      where: { status: "SCHEDULED", startsAt: { gte: new Date(), lt: weekEnd } },
    }),
    prisma.training.findMany({
      where: { startsAt: { gte: todayStart, lt: todayEnd } },
      include: {
        trainer: true,
        room: true,
        _count: { select: { bookings: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.count({
      where: {
        status: { in: ["ACTIVE", "ATTENDED"] },
        training: { startsAt: { gte: todayStart, lt: todayEnd } },
      },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: monthAgo } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { actor: true },
    }),
    prisma.notification.count({ where: { status: "SENT", readAt: null } }),
  ]);

  const capacityToday = todayTrainings.reduce(
    (sum, training) => sum + training.capacity,
    0,
  );
  const bookedToday = todayTrainings.reduce(
    (sum, training) => sum + training._count.bookings,
    0,
  );
  const occupancy =
    capacityToday > 0 ? Math.round((bookedToday / capacityToday) * 100) : 0;

  const stats = [
    {
      label: "Клиенты",
      value: String(clients),
      hint: "активных аккаунтов",
    },
    {
      label: "Тренировок за 7 дней",
      value: String(upcoming),
      hint: "в расписании",
    },
    {
      label: "Записей сегодня",
      value: String(activeBookings),
      hint: `${occupancy}% загрузки`,
    },
    {
      label: "Выручка за 30 дней",
      value: formatMoney(revenue._sum.amountCents ?? 0),
      hint: `${revenue._count} ${plural(revenue._count, "платёж", "платежа", "платежей")}`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-extrabold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/schedule"
          className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-95"
        >
          Создать тренировку
        </Link>
        <Link
          href="/admin/checkin"
          className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted transition hover:text-ink"
        >
          Чек-ин по QR
        </Link>
        <a
          href="/api/admin/export"
          className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted transition hover:text-ink"
        >
          Экспорт CSV
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Сегодня в залах
          </h2>

          {todayTrainings.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
              На сегодня тренировок нет.
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {todayTrainings.map((training) => {
                const booked = training._count.bookings;
                const fill = Math.min(
                  Math.round((booked / training.capacity) * 100),
                  100,
                );
                return (
                  <li key={training.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {formatTime(training.startsAt)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {training.title}
                      </span>
                      <span className="text-xs text-muted">
                        {booked}/{training.capacity}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {training.trainer.name} · {training.room.name}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              Последние действия
            </h2>
            <Link
              href="/admin/audit"
              className="text-xs text-accent hover:underline"
            >
              Весь журнал
            </Link>
          </div>

          {audit.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
              Журнал пуст.
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {audit.map((entry) => (
                <li key={entry.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">
                    {ACTION_LABEL[entry.action] ?? entry.action}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {entry.actor?.name ?? entry.actor?.phone ?? "система"} ·{" "}
                    {new Intl.DateTimeFormat("ru-RU", {
                      timeZone: "Europe/Moscow",
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(entry.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-muted">
            Непрочитанных уведомлений у клиентов: {unreadNotifications}
          </p>
        </section>
      </div>
    </div>
  );
}

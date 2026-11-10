import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { markAllNotificationsRead } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

const EVENT_LABEL: Record<string, string> = {
  BOOKING_CONFIRMED: "Запись подтверждена",
  BOOKING_CANCELLED: "Запись отменена",
  TRAINING_CANCELLED: "Тренировка отменена",
  SUBSCRIPTION_PURCHASED: "Абонемент оформлен",
};

function payloadText(payload: string | null): string {
  if (!payload) return "";
  try {
    const data = JSON.parse(payload) as {
      title?: string;
      plan?: string;
      lessons?: number;
    };
    if (data.plan) {
      return `Тариф «${data.plan}», занятий: ${data.lessons ?? "—"}`;
    }
    if (data.title) return data.title;
    return payload;
  } catch {
    return payload;
  }
}

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((item) => item.readAt === null).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Уведомления
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Что нового</h1>
          <p className="mt-1 text-sm text-muted">
            Непрочитанных: {unread}
          </p>
        </div>

        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-xl border border-line px-4 py-2 text-sm text-muted transition hover:text-ink"
            >
              Отметить все прочитанными
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="font-semibold">Пока пусто</p>
          <p className="mt-1 text-sm text-muted">
            Здесь появятся подтверждения записи и напоминания.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink"
          >
            Открыть расписание
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {notifications.map((item) => (
            <li
              key={item.id}
              className={[
                "rounded-2xl border px-4 py-3",
                item.readAt
                  ? "border-line bg-surface"
                  : "border-accent/40 bg-accent/5",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {EVENT_LABEL[item.event] ?? item.event}
                </span>
                {!item.readAt && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-ink">
                    новое
                  </span>
                )}
                <span className="ml-auto text-xs text-muted">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {payloadText(item.payload)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

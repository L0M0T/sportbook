import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  TRAINING_CREATED: "Создана тренировка",
  TRAINING_CANCELLED: "Отменена тренировка",
  BOOKING_CHECKED_IN: "Чек-ин по QR",
  USER_ROLE_CHANGED: "Изменена роль",
  USER_BLOCKED: "Пользователь заблокирован",
  USER_UNBLOCKED: "Пользователь разблокирован",
};

export default async function AdminAuditPage() {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: true },
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          Журнал действий · {entries.length}
        </h2>
        <p className="text-xs text-muted">
          Каждое изменение расписания и прав доступа фиксируется автоматически.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
          Журнал пуст.
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {entries.map((entry) => (
            <li key={entry.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">
                  {ACTION_LABEL[entry.action] ?? entry.action}
                </span>
                <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
                  {entry.entity}
                </span>
                <span className="ml-auto text-xs text-muted">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Автор: {entry.actor?.name ?? entry.actor?.phone ?? "система"}
                {entry.after ? ` · ${entry.after}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

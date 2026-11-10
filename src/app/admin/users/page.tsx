import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { plural } from "@/lib/format";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  CLIENT: "Клиент",
  MANAGER: "Менеджер",
  ADMIN: "Администратор",
};

export default async function AdminUsersPage() {
  const session = await getSession();
  const users = await prisma.user.findMany({
    orderBy: [{ deletedAt: "asc" }, { createdAt: "desc" }],
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { validUntil: "desc" },
        take: 1,
      },
      _count: {
        select: {
          bookings: { where: { status: { in: ["ACTIVE", "ATTENDED"] } } },
        },
      },
    },
    take: 200,
  });

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          Пользователи · {users.length}
        </h2>
        <p className="text-xs text-muted">
          Блокировка запрещает вход, история сохраняется.
        </p>
      </div>

      <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {users.map((user) => {
          const blocked = user.deletedAt !== null;
          const subscription = user.subscriptions[0];
          return (
            <li
              key={user.id}
              className={[
                "flex flex-wrap items-center gap-3 px-4 py-3",
                blocked ? "opacity-60" : "",
              ].join(" ")}
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {user.name ?? "Без имени"}
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted">
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                  {blocked && (
                    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-medium text-danger">
                      заблокирован
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatPhone(user.phone)}
                  {user.email ? ` · ${user.email}` : ""} ·{" "}
                  {user._count.bookings}{" "}
                  {plural(
                    user._count.bookings,
                    "запись",
                    "записи",
                    "записей",
                  )}
                  {subscription
                    ? ` · абонемент: ${subscription.left} ${plural(
                        subscription.left,
                        "занятие",
                        "занятия",
                        "занятий",
                      )}`
                    : " · без абонемента"}
                </p>
              </div>

              <UserActions
                userId={user.id}
                role={user.role}
                blocked={blocked}
                isSelf={user.id === session?.userId}
                canManageRoles={session?.role === "ADMIN"}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

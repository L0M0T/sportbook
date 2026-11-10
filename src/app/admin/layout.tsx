import { requireStaff } from "@/lib/access";
import { AdminNav } from "./admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            Панель сотрудника
          </p>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
            Управление спортцентром
          </h1>
          <p className="mt-1 text-sm text-muted">
            Вы вошли как {session.role === "ADMIN" ? "администратор" : "менеджер"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AdminNav />
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}

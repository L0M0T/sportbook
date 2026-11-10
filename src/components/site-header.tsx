import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { formatPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/access";

export async function SiteHeader() {
  const session = await getSession();

  const unread = session
    ? await prisma.notification.count({
        where: { userId: session.userId, readAt: null },
      })
    : 0;

  const navLink =
    "rounded-lg px-3 py-2 whitespace-nowrap transition hover:bg-surface-2 hover:text-ink";

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight whitespace-nowrap"
        >
          SPORT<span className="text-accent">BOOK</span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-sm text-muted">
          <Link href="/" className={navLink}>
            Расписание
          </Link>
          {session && (
            <Link href="/my" className={navLink}>
              Мои записи
            </Link>
          )}
          <Link href="/subscriptions" className={navLink}>
            Абонементы
          </Link>
          {session && (
            <Link href="/notifications" className={`${navLink} relative`}>
              Уведомления
              {unread > 0 && (
                <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-ink">
                  {unread}
                </span>
              )}
            </Link>
          )}
          {session && isStaffRole(session.role) && (
            <Link href="/admin" className={navLink}>
              Админка
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-3 text-sm">
          {session ? (
            <>
              <span className="hidden text-muted lg:inline">
                {formatPhone(session.phone)}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg border border-line px-3 py-1.5 text-muted transition hover:border-accent/60 hover:text-ink"
                >
                  Выйти
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-ink transition hover:brightness-95"
            >
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

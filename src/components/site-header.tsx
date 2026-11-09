import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { formatPhone } from "@/lib/phone";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
        <Link
          href="/"
          className="text-lg font-extrabold tracking-tight whitespace-nowrap"
        >
          SPORT<span className="text-accent">BOOK</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm text-muted sm:flex">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 transition hover:bg-surface-2 hover:text-ink"
          >
            Расписание
          </Link>
          {session && (
            <Link
              href="/my"
              className="rounded-lg px-3 py-2 transition hover:bg-surface-2 hover:text-ink"
            >
              Мои записи
            </Link>
          )}
          <Link
            href="/subscriptions"
            className="rounded-lg px-3 py-2 transition hover:bg-surface-2 hover:text-ink"
          >
            Абонементы
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {session ? (
            <>
              <span className="hidden text-muted md:inline">
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

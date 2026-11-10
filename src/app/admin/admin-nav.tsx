"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Сводка" },
  { href: "/admin/schedule", label: "Расписание" },
  { href: "/admin/checkin", label: "Чек-ин" },
  { href: "/admin/users", label: "Клиенты" },
  { href: "/admin/audit", label: "Журнал" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-line bg-surface p-1.5">
      {LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              "rounded-xl px-3.5 py-2 text-sm transition",
              active
                ? "bg-accent font-semibold text-accent-ink"
                : "text-muted hover:bg-surface-2 hover:text-ink",
            ].join(" ")}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

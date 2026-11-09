import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  dayKey,
  formatDate,
  formatMoney,
  formatTime,
  plural,
} from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ dir?: string; day?: string }>;

const DAY_OPTIONS = [
  { key: "today", label: "Сегодня" },
  { key: "tomorrow", label: "Завтра" },
  { key: "week", label: "7 дней" },
];

function filterHref(next: { dir?: string | null; day: string }): string {
  const params = new URLSearchParams();
  if (next.dir) params.set("dir", next.dir);
  if (next.day !== "week") params.set("day", next.day);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function chipClass(active: boolean): string {
  return [
    "rounded-full border px-3.5 py-1.5 text-sm transition",
    active
      ? "border-accent bg-accent text-accent-ink font-semibold"
      : "border-line text-muted hover:border-accent/50 hover:text-ink",
  ].join(" ");
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const day = params.day ?? "week";
  const dir = params.dir ?? null;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  let rangeStart = now;
  let rangeEnd = new Date(startOfToday.getTime() + 7 * 86_400_000);

  if (day === "today") {
    rangeEnd = new Date(startOfToday.getTime() + 86_400_000);
  }
  if (day === "tomorrow") {
    rangeStart = new Date(startOfToday.getTime() + 86_400_000);
    rangeEnd = new Date(startOfToday.getTime() + 2 * 86_400_000);
  }

  const [trainings, directions] = await Promise.all([
    prisma.training.findMany({
      where: {
        status: "SCHEDULED",
        startsAt: { gte: rangeStart, lt: rangeEnd },
        ...(dir ? { direction: dir } : {}),
      },
      include: {
        trainer: true,
        room: true,
        _count: {
          select: { bookings: { where: { status: "ACTIVE" } } },
        },
      },
      orderBy: { startsAt: "asc" },
      take: 100,
    }),
    prisma.training.findMany({
      where: { status: "SCHEDULED", startsAt: { gte: now } },
      select: { direction: true },
      distinct: ["direction"],
      orderBy: { direction: "asc" },
    }),
  ]);

  const groups = new Map<string, typeof trainings>();
  for (const training of trainings) {
    const key = dayKey(training.startsAt);
    const list = groups.get(key) ?? [];
    list.push(training);
    groups.set(key, list);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16">
      <section className="pt-10 sm:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          Онлайн-запись
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Тренировки без звонков и очередей
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Выберите направление, время и тренера. Запись занимает меньше минуты,
          абонемент списывается автоматически.
        </p>
      </section>

      <section className="mt-8 flex flex-col gap-4 border-y border-line/70 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Link href={filterHref({ dir: null, day })} className={chipClass(!dir)}>
            Все
          </Link>
          {directions.map((item) => (
            <Link
              key={item.direction}
              href={filterHref({ dir: item.direction, day })}
              className={chipClass(dir === item.direction)}
            >
              {item.direction}
            </Link>
          ))}
        </div>

        <div className="flex gap-2">
          {DAY_OPTIONS.map((option) => (
            <Link
              key={option.key}
              href={filterHref({ dir, day: option.key })}
              className={chipClass(day === option.key)}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </section>

      {groups.size === 0 ? (
        <div className="mt-12 rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="text-lg font-semibold">Пока нет тренировок</p>
          <p className="mt-2 text-sm text-muted">
            Попробуйте выбрать другой день или направление.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {[...groups.entries()].map(([key, list]) => (
            <section key={key}>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
                {formatDate(list[0].startsAt)}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((training) => {
                  const free = Math.max(
                    training.capacity - training._count.bookings,
                    0,
                  );
                  return (
                    <Link
                      key={training.id}
                      href={`/training/${training.id}`}
                      className="group flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-accent/50 hover:bg-surface-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-lg font-semibold">
                          {formatTime(training.startsAt)}
                        </span>
                        <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
                          {training.direction}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-semibold group-hover:text-accent">
                          {training.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                          {training.trainer.name} · {training.room.name}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-between text-sm">
                        <span
                          className={
                            free === 0 ? "text-danger" : "text-muted"
                          }
                        >
                          {free === 0
                            ? "Мест нет"
                            : `${free} ${plural(free, "место", "места", "мест")}`}
                        </span>
                        <span className="font-semibold">
                          {training.priceCents > 0
                            ? formatMoney(training.priceCents)
                            : "Бесплатно"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

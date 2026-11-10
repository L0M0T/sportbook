import { prisma } from "@/lib/prisma";
import { formatTime, plural } from "@/lib/format";
import { moscowMidnight } from "@/lib/time";
import { CheckinForm } from "./checkin-form";

export const dynamic = "force-dynamic";

export default async function AdminCheckinPage() {
  const todayStart = moscowMidnight(0);
  const todayEnd = moscowMidnight(1);

  const [trainings, recent] = await Promise.all([
    prisma.training.findMany({
      where: {
        startsAt: { gte: todayStart, lt: todayEnd },
        status: "SCHEDULED",
      },
      include: {
        room: true,
        trainer: true,
        bookings: {
          where: { status: { in: ["ACTIVE", "ATTENDED"] } },
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { checkedInAt: { not: null } },
      include: {
        user: true,
        training: { include: { room: true } },
      },
      orderBy: { checkedInAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <CheckinForm />

      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Сегодняшние группы
          </h2>

          {trainings.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
              Сегодня тренировок нет.
            </div>
          ) : (
            <ul className="space-y-3">
              {trainings.map((training) => {
                const attended = training.bookings.filter(
                  (booking) => booking.status === "ATTENDED",
                ).length;
                return (
                  <li
                    key={training.id}
                    className="rounded-2xl border border-line bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {formatTime(training.startsAt)}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {training.title}
                      </span>
                      <span className="text-xs text-muted">
                        {attended}/{training.bookings.length}{" "}
                        {plural(
                          training.bookings.length,
                          "отмечен",
                          "отмечено",
                          "отмечено",
                        )}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {training.trainer.name} · {training.room.name}
                    </p>

                    {training.bookings.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {training.bookings.map((booking) => (
                          <span
                            key={booking.id}
                            className={[
                              "rounded-full border px-2.5 py-0.5 text-xs",
                              booking.status === "ATTENDED"
                                ? "border-accent/40 bg-accent/10 text-accent"
                                : "border-line text-muted",
                            ].join(" ")}
                          >
                            {booking.user.name ?? booking.user.phone}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Последние чек-ины
          </h2>

          {recent.length === 0 ? (
            <p className="text-sm text-muted">Пока никто не отмечен.</p>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {recent.map((booking) => (
                <li
                  key={booking.id}
                  className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {booking.user.name ?? booking.user.phone}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {booking.training.title} · {booking.training.room.name}
                  </span>
                  <span className="font-mono text-xs text-accent">
                    {booking.checkedInAt && formatTime(booking.checkedInAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

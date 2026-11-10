import { prisma } from "@/lib/prisma";
import { dayKey, formatDate, formatMoney, formatTime, plural } from "@/lib/format";
import { moscowMidnight } from "@/lib/time";
import { TrainingForm } from "./training-form";
import { CancelTrainingButton } from "./cancel-training-button";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const [trainers, rooms, trainings] = await Promise.all([
    prisma.trainer.findMany({ orderBy: { name: "asc" } }),
    prisma.room.findMany({ orderBy: { name: "asc" } }),
    prisma.training.findMany({
      where: { startsAt: { gte: new Date(), lt: moscowMidnight(14) } },
      include: {
        trainer: true,
        room: true,
        _count: { select: { bookings: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { startsAt: "asc" },
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
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <TrainingForm
        trainers={trainers.map((trainer) => ({
          id: trainer.id,
          name: trainer.name,
        }))}
        rooms={rooms.map((room) => ({ id: room.id, name: room.name }))}
        defaultDate={dayKey(moscowMidnight(1))}
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
          Ближайшие 14 дней
        </h2>

        {groups.size === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-muted">
            В расписании пока пусто.
          </div>
        ) : (
          <div className="space-y-6">
            {[...groups.entries()].map(([key, list]) => (
              <div key={key}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {formatDate(list[0].startsAt)}
                </h3>
                <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                  {list.map((training) => {
                    const cancelled = training.status === "CANCELLED";
                    return (
                      <li
                        key={training.id}
                        className={[
                          "flex flex-wrap items-center gap-3 px-4 py-3",
                          cancelled ? "opacity-60" : "",
                        ].join(" ")}
                      >
                        <span className="font-mono text-sm font-semibold">
                          {formatTime(training.startsAt)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">
                            {training.title}
                            {cancelled && (
                              <span className="ml-2 rounded-full bg-danger/15 px-2 py-0.5 text-xs font-medium text-danger">
                                отменена
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {training.trainer.name} · {training.room.name} ·{" "}
                            {training._count.bookings}/{training.capacity}{" "}
                            {plural(
                              training._count.bookings,
                              "запись",
                              "записи",
                              "записей",
                            )}{" "}
                            · {formatMoney(training.priceCents)}
                          </p>
                        </div>
                        {!cancelled && (
                          <CancelTrainingButton
                            trainingId={training.id}
                            title={training.title}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

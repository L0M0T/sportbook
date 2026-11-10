import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDateTime, formatMoney } from "@/lib/format";
import { BookButton } from "./book-button";

export const dynamic = "force-dynamic";

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const training = await prisma.training.findUnique({
    where: { id },
    include: {
      trainer: true,
      room: true,
      _count: {
        select: { bookings: { where: { status: "ACTIVE" } } },
      },
    },
  });

  if (!training) notFound();

  const free = Math.max(training.capacity - training._count.bookings, 0);
  const myBooking = session
    ? await prisma.booking.findUnique({
        where: {
          userId_trainingId: { userId: session.userId, trainingId: id },
        },
      })
    : null;

  const isActive = myBooking?.status === "ACTIVE";
  const started = training.startsAt.getTime() <= new Date().getTime();
  const unavailable =
    training.status !== "SCHEDULED" || started || free === 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <Link
        href="/"
        className="text-sm text-muted transition hover:text-ink"
      >
        ← Расписание
      </Link>

      {training.status !== "SCHEDULED" && (
        <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4 text-sm text-danger">
          Тренировка отменена администратором.
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
              {training.direction}
            </span>
            <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
              {training.type === "GROUP" ? "Групповая" : "Персональная"}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight">
            {training.title}
          </h1>
          <p className="mt-2 text-muted">
            {formatDateTime(training.startsAt)} · {training.durationMin} мин
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
            <div>
              <dt className="text-muted">Тренер</dt>
              <dd className="mt-1 font-semibold">{training.trainer.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Зал</dt>
              <dd className="mt-1 font-semibold">{training.room.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Свободно мест</dt>
              <dd className="mt-1 font-semibold">
                {free} из {training.capacity}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Стоимость</dt>
              <dd className="mt-1 font-semibold">
                {training.priceCents > 0
                  ? formatMoney(training.priceCents)
                  : "Бесплатно"}
              </dd>
            </div>
          </dl>
        </section>

        <aside className="flex flex-col rounded-3xl border border-line bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Стоимость
          </p>
          <p className="mt-2 text-4xl font-extrabold">
            {training.priceCents > 0
              ? formatMoney(training.priceCents)
              : "0 ₽"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Списывается одно занятие с абонемента
          </p>

          <div className="mt-6">
            {!session ? (
              <Link
                href="/login"
                className="block w-full rounded-xl bg-accent px-4 py-3 text-center font-semibold text-accent-ink transition hover:brightness-95"
              >
                Войти и записаться
              </Link>
            ) : isActive ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
                  Вы записаны
                </div>
                <Link
                  href="/my"
                  className="block w-full rounded-xl border border-line px-4 py-3 text-center text-sm text-muted transition hover:text-ink"
                >
                  Мои записи
                </Link>
              </div>
            ) : (
              <BookButton
                trainingId={training.id}
                disabled={unavailable}
                label={
                  training.status !== "SCHEDULED"
                    ? "Отменена"
                    : started
                      ? "Уже началась"
                      : free === 0
                        ? "Мест нет"
                        : "Записаться"
                }
              />
            )}
          </div>

          <p className="mt-auto pt-6 text-xs leading-relaxed text-muted">
            Отменить или перенести запись можно не позднее чем за 2 часа до
            начала — занятие вернётся на абонемент.
          </p>
        </aside>
      </div>
    </div>
  );
}

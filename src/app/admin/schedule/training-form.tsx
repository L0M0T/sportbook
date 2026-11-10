"use client";

import { useActionState } from "react";
import { createTraining, type FormState } from "@/app/actions/admin";

const initial: FormState = { ok: false };

type Option = { id: string; name: string };

export function TrainingForm({
  trainers,
  rooms,
  defaultDate,
}: {
  trainers: Option[];
  rooms: Option[];
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(createTraining, initial);

  return (
    <form action={formAction} className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">Новая тренировка</h2>
      <p className="mt-1 text-sm text-muted">
        Время указывается по Москве. Тренировка сразу появится в расписании.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Название
          </span>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Кроссфит"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          />
        </label>

        <label>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Направление
          </span>
          <input
            name="direction"
            required
            maxLength={60}
            placeholder="Кроссфит"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          />
        </label>

        <label>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Тип
          </span>
          <select
            name="type"
            defaultValue="GROUP"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          >
            <option value="GROUP">Групповая</option>
            <option value="PERSONAL">Персональная</option>
          </select>
        </label>

        <label>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Тренер
          </span>
          <select
            name="trainerId"
            required
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          >
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Зал
          </span>
          <select
            name="roomId"
            required
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Дата
          </span>
          <input
            type="date"
            name="date"
            required
            defaultValue={defaultDate}
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          />
        </label>

        <label>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Время (МСК)
          </span>
          <input
            type="time"
            name="time"
            required
            defaultValue="10:00"
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          />
        </label>

        <label>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Длительность, мин
          </span>
          <input
            type="number"
            name="durationMin"
            min={15}
            max={240}
            defaultValue={60}
            required
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          />
        </label>

        <label>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Мест
          </span>
          <input
            type="number"
            name="capacity"
            min={1}
            max={60}
            defaultValue={12}
            required
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          />
        </label>

        <label>
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Цена, ₽
          </span>
          <input
            type="number"
            name="price"
            min={0}
            max={100000}
            step={50}
            defaultValue={1200}
            required
            className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 outline-none transition focus:border-accent"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Создаём…" : "Создать тренировку"}
      </button>

      {state.error && (
        <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="mt-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          {state.message}
        </p>
      )}
    </form>
  );
}

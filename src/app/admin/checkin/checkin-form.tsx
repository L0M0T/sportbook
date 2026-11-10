"use client";

import { useActionState } from "react";
import { checkInBooking, type FormState } from "@/app/actions/admin";

const initial: FormState = { ok: false };

export function CheckinForm() {
  const [state, formAction, pending] = useActionState(checkInBooking, initial);

  return (
    <form action={formAction} className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="text-lg font-bold">Отметить визит</h2>
      <p className="mt-1 text-sm text-muted">
        Отсканируйте QR-код клиента или введите код вручную. Чек-ин доступен за
        час до начала и до конца тренировки.
      </p>

      <label className="mt-4 block">
        <span className="text-xs uppercase tracking-[0.14em] text-muted">
          Код записи или QR-токен
        </span>
        <input
          name="code"
          required
          autoFocus
          autoComplete="off"
          placeholder="Вставьте код из QR"
          className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2.5 font-mono text-sm outline-none transition focus:border-accent"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Проверяем…" : "Подтвердить чек-ин"}
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

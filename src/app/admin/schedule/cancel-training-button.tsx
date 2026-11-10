"use client";

import { useActionState, useState } from "react";
import { cancelTraining, type FormState } from "@/app/actions/admin";

const initial: FormState = { ok: false };

export function CancelTrainingButton({
  trainingId,
  title,
}: {
  trainingId: string;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(cancelTraining, initial);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="text-right">
      <form action={formAction} className="flex items-center justify-end gap-1.5">
        <input type="hidden" name="trainingId" value={trainingId} />
        {confirming ? (
          <>
            <span className="text-xs text-muted">Снять записи?</span>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-danger/50 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
            >
              {pending ? "…" : "Да, отменить"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted transition hover:text-ink"
            >
              Нет
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label={`Отменить тренировку «${title}»`}
            className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:border-danger/60 hover:text-danger"
          >
            Отменить
          </button>
        )}
      </form>
      {state.error && <p className="mt-1 max-w-56 text-xs text-danger">{state.error}</p>}
      {state.ok && state.message && (
        <p className="mt-1 max-w-56 text-xs text-accent">{state.message}</p>
      )}
    </div>
  );
}

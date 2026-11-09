"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookTraining } from "@/app/actions/booking";

export function BookButton({
  trainingId,
  disabled,
  label,
}: {
  trainingId: string;
  disabled: boolean;
  label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await bookTraining(trainingId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push("/my");
            router.refresh();
          })
        }
        className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Записываем…" : label}
      </button>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

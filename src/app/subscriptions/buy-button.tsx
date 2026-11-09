"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { purchaseSubscription } from "@/app/actions/subscription";

export function BuyButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await purchaseSubscription(planId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push("/my");
            router.refresh();
          })
        }
        className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Оплачиваем…" : "Оформить"}
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

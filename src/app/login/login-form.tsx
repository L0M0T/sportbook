"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+7 ");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { error?: string; devCode?: string };

      if (!res.ok) {
        setError(data.error ?? "Не удалось отправить код");
        return;
      }

      setDevCode(data.devCode ?? null);
      setCode("");
      setStep("code");
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Неверный код");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Нет связи с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Вход
      </p>
      <h1 className="mt-3 text-2xl font-bold">
        {step === "phone" ? "Ваш телефон" : "Код из SMS"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {step === "phone"
          ? "Пришлём одноразовый код. Пароль не нужен."
          : `Код отправлен на ${phone}`}
      </p>

      {step === "phone" ? (
        <form onSubmit={requestCode} className="mt-6 space-y-4">
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+7 999 123-45-67"
            className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-lg outline-none transition focus:border-accent"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "Отправляем…" : "Получить код"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="mt-6 space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="0000"
            className="w-full rounded-xl border border-line bg-bg px-4 py-3 text-center font-mono text-3xl tracking-[0.5em] outline-none transition focus:border-accent"
            required
          />

          {devCode && (
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              Демо-режим: код{" "}
              <span className="font-mono font-bold text-accent">{devCode}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 4}
            className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
          >
            {loading ? "Проверяем…" : "Войти"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError(null);
              setDevCode(null);
            }}
            className="w-full rounded-xl border border-line px-4 py-3 text-sm text-muted transition hover:text-ink"
          >
            Изменить номер
          </button>
        </form>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Вход по номеру телефона. В демо-версии SMS имитируется, код показывается
        на экране.
      </p>
    </div>
  );
}

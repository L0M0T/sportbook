import Link from "next/link";

export const metadata = {
  title: "Нет сети — SportBook",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        Офлайн
      </p>
      <h1 className="mt-3 text-3xl font-extrabold">Нет подключения</h1>
      <p className="mt-3 text-muted">
        Расписание, которое вы открывали раньше, доступно без сети. Запись и
        оплата появятся, когда соединение восстановится.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-accent px-5 py-2.5 font-semibold text-accent-ink"
      >
        Попробовать снова
      </Link>
    </div>
  );
}

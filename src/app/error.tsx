"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="surface-card max-w-xl rounded-[2.2rem] px-8 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          Ошибка
        </p>
        <h1 className="mt-4 font-display text-4xl leading-none text-[var(--ink-strong)] md:text-5xl">
          Что-то пошло не так
        </h1>
        <p className="mt-5 text-base leading-8 text-[var(--muted)]">
          Произошла непредвиденная ошибка. Попробуйте обновить страницу или
          вернуться позже.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-semibold text-white"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

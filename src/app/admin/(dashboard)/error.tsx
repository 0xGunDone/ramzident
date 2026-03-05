"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md rounded-[2rem] border border-black/5 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-600">
          Ошибка
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950">
          Произошла ошибка
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Попробуйте обновить страницу. Если ошибка повторяется — обратитесь к
          разработчику.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

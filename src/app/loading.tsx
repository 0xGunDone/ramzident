export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--line)] border-t-[var(--accent)]" />
        <p className="text-sm text-[var(--muted)]">Загрузка...</p>
      </div>
    </div>
  );
}

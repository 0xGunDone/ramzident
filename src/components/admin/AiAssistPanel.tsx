"use client";

interface AiAssistPanelProps {
  description: string;
  disabled?: boolean;
  loading?: boolean;
  buttonLabel?: string;
  loadingLabel?: string;
  onGenerate: () => void;
}

export default function AiAssistPanel({
  description,
  disabled = false,
  loading = false,
  buttonLabel = "AI заполнить",
  loadingLabel = "Генерация...",
  onGenerate,
}: AiAssistPanelProps) {
  return (
    <div className="rounded-[1.6rem] border border-violet-200 bg-violet-50/70 px-5 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            AI черновик редактора
          </p>
          <p className="text-xs leading-6 text-slate-600">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading || disabled}
          className="rounded-full border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-violet-700 disabled:opacity-50"
        >
          {loading ? loadingLabel : buttonLabel}
        </button>
      </div>
    </div>
  );
}

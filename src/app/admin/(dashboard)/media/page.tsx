"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import type { MediaItem } from "@/types";

const usageOptions = [
  "",
  "hero",
  "about",
  "gallery",
  "doctor",
  "service",
  "document",
];

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    if (typeof data?.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }
  } catch {}

  return fallback;
}

export default function MediaManager() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredMediaList = mediaList.filter(
    (item) =>
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      (item.label || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.usage || "").toLowerCase().includes(search.toLowerCase())
  );
  const [editForm, setEditForm] = useState({
    label: "",
    altText: "",
    seoTitle: "",
    seoDescription: "",
    context: "",
    usage: "",
  });
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/admin/media");
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Не удалось загрузить медиатеку"));
        }

        const data = await response.json();
        setMediaList(data);
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Не удалось загрузить медиатеку");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const refreshMedia = async () => {
    const response = await fetch("/api/admin/media");
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Не удалось обновить медиатеку"));
    }

    const data = await response.json();
    setMediaList(data);
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("usage", "");
    setUploading(true);

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Не удалось загрузить файл"));
      }

      await refreshMedia();
      toast.success("Файл загружен");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить файл");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const startEditing = (item: MediaItem) => {
    setEditingId(item.id);
    setEditForm({
      label: item.label || "",
      altText: item.altText || "",
      seoTitle: item.seoTitle || "",
      seoDescription: item.seoDescription || "",
      context: item.context || "",
      usage: item.usage || "",
    });
  };

  const handleReplace = async (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setReplacingId(id);

    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Не удалось заменить файл"));
      }

      await refreshMedia();
      toast.success("Файл заменён. SEO и связи сохранены.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Не удалось заменить файл");
    } finally {
      setReplacingId(null);
      event.target.value = "";
    }
  };

  const saveMeta = async (id: string) => {
    const response = await fetch(`/api/admin/media/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });

    if (!response.ok) {
      toast.error("Не удалось сохранить метаданные");
      return;
    }

    await refreshMedia();
    setEditingId(null);
    toast.success("Метаданные сохранены");
  };

  const removeMedia = async (id: string) => {
    if (!confirm("Удалить файл?")) return;

    const response = await fetch(`/api/admin/media/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) return;
    await refreshMedia();
    toast.success("Файл удалён");
  };

  const generateAI = async (id: string) => {
    setAiGenerating(id);

    try {
      await fetch(`/api/admin/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: editForm.context }),
      });

      const response = await fetch(`/api/admin/media/${id}/ai-seo`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const updated = await response.json();
      setEditForm((current) => ({
        ...current,
        altText: updated.altText || "",
        seoTitle: updated.seoTitle || "",
        seoDescription: updated.seoDescription || "",
      }));
      await refreshMedia();
    } catch (error) {
      console.error(error);
      toast.error("AI SEO недоступен. Проверьте ключ OpenRouter в Настройках.");
    } finally {
      setAiGenerating(null);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Медиа</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Явная медиатека с назначением файлов по usage: hero, gallery, doctor,
            service и document. Поддерживаются изображения, PDF и другие файлы.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
          {uploading ? "Загрузка..." : "Загрузить файл"}
          <input
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по имени, названию или usage..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
      />

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {filteredMediaList.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.8rem] border border-black/5 bg-white shadow-sm"
          >
            <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-t-[1.8rem] bg-slate-100">
              {item.mimeType.startsWith("image/") ? (
                <Image
                  src={item.path}
                  alt={item.altText || item.filename}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1280px) 100vw, 33vw"
                />
              ) : (
                <div className="px-4 text-center text-sm font-medium text-slate-500">
                  {item.filename}
                </div>
              )}
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {item.label || item.filename}
                  </h2>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {item.path}
                    <br />
                    {item.mimeType}
                    {item.width && item.height ? ` • ${item.width}×${item.height}` : ""}
                    {item.sizeBytes ? ` • ${Math.round(item.sizeBytes / 1024)} KB` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMedia(item.id)}
                  className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                >
                  Удалить
                </button>
              </div>

              {editingId === item.id ? (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
                    {replacingId === item.id ? "Замена..." : "Заменить файл"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(event) => handleReplace(item.id, event)}
                      disabled={replacingId === item.id}
                    />
                  </label>
                  <p className="text-xs leading-6 text-slate-500">
                    Подменяет сам файл, но сохраняет текущие SEO-поля, alt и связи с
                    врачами, услугами и документами.
                  </p>
                  <input
                    value={editForm.label}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, label: event.target.value }))
                    }
                    placeholder="Название файла"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <select
                    value={editForm.usage}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, usage: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    {usageOptions.map((option) => (
                      <option key={option || "none"} value={option}>
                        {option || "Без назначения"}
                      </option>
                    ))}
                  </select>
                  <input
                    value={editForm.context}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, context: event.target.value }))
                    }
                    placeholder="Контекст для AI"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <input
                    value={editForm.altText}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, altText: event.target.value }))
                    }
                    placeholder="Alt текст"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <input
                    value={editForm.seoTitle}
                    onChange={(event) =>
                      setEditForm((current) => ({ ...current, seoTitle: event.target.value }))
                    }
                    placeholder="SEO title"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <textarea
                    value={editForm.seoDescription}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        seoDescription: event.target.value,
                      }))
                    }
                    placeholder="SEO description"
                    className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {item.mimeType.startsWith("image/") ? (
                      <button
                        type="button"
                        onClick={() => generateAI(item.id)}
                        className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700"
                        disabled={aiGenerating === item.id}
                      >
                        {aiGenerating === item.id ? "Генерация..." : "AI SEO"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">
                        AI SEO только для изображений
                      </span>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={() => saveMeta(item.id)}
                        className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <p>Usage: {item.usage || "не задан"}</p>
                  {item.altText ? <p>Alt: {item.altText}</p> : null}
                  {item.seoTitle ? <p>SEO title: {item.seoTitle}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
                      {replacingId === item.id ? "Замена..." : "Заменить файл"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(event) => handleReplace(item.id, event)}
                        disabled={replacingId === item.id}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

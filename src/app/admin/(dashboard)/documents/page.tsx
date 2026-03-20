"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AiAssistPanel from "@/components/admin/AiAssistPanel";
import { requestAdminAiDraft } from "@/lib/admin-ai-client";
import type { DocumentItem, MediaOption } from "@/types";
import { isUploadedMediaPath } from "@/lib/images";

const initialForm = {
  title: "",
  slug: "",
  description: "",
  type: "document",
  fileId: "",
  enabled: false,
};

function isDocumentMediaOption(file: MediaOption) {
  const mimeType = file.mimeType || "";
  return mimeType === "application/pdf" || mimeType.startsWith("image/");
}

function getDocumentFileLabel(mimeType: string | undefined) {
  if (!mimeType) return "Файл";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Изображение";
  return mimeType;
}

export default function DocumentsManager() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [files, setFiles] = useState<MediaOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [aiGenerating, setAiGenerating] = useState(false);

  interface DocumentAiDraft {
    title?: string | null;
    description?: string | null;
    type?: string | null;
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.type.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [documentsResponse, mediaResponse] = await Promise.all([
          fetch("/api/admin/documents"),
          fetch("/api/admin/media"),
        ]);
        const documentsData = await documentsResponse.json();
        const mediaData = await mediaResponse.json();

        setDocuments(documentsData);
        setFiles(mediaData.filter((item: MediaOption) => isDocumentMediaOption(item)));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const refresh = async () => {
    const response = await fetch("/api/admin/documents");
    const data = await response.json();
    setDocuments(data);
  };

  const selectedFile = files.find((file) => file.id === formData.fileId) || null;

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const startEdit = (document: DocumentItem) => {
    setEditingId(document.id);
    setFormData({
      title: document.title,
      slug: document.slug,
      description: document.description || "",
      type: document.type,
      fileId: document.fileId || "",
      enabled: document.enabled,
    });
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const isNew = editingId === "new";

    const response = await fetch(
      isNew ? "/api/admin/documents" : `/api/admin/documents/${editingId}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          fileId: formData.fileId || null,
        }),
      }
    );

    if (!response.ok) {
      toast.error("Не удалось сохранить");
      return;
    }

    await refresh();
    resetForm();
    toast.success("Документ сохранён");
  };

  const generateAiDraft = async () => {
    if (
      !formData.title.trim() &&
      !formData.description.trim() &&
      !selectedFile &&
      !formData.type.trim()
    ) {
      toast.error("Для AI заполнения укажите хотя бы название, тип, описание или файл");
      return;
    }

    setAiGenerating(true);

    try {
      const draft = await requestAdminAiDraft<DocumentAiDraft>("document", {
        title: formData.title || null,
        description: formData.description || null,
        type: formData.type || null,
        file: selectedFile
          ? {
              label: selectedFile.label || null,
              path: selectedFile.path,
              mimeType: selectedFile.mimeType || null,
            }
          : null,
      });

      setFormData((current) => ({
        ...current,
        title: draft.title ?? current.title,
        description: draft.description ?? current.description,
        type: draft.type ?? current.type,
      }));
      toast.success("AI подготовил черновик документа");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "AI заполнение недоступно"
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const moveDocument = async (id: string, direction: -1 | 1) => {
    const index = documents.findIndex((document) => document.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= documents.length) return;

    const reordered = [...documents];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];

    const normalized = reordered.map((document, order) => ({ ...document, order }));
    setDocuments(normalized);

    await fetch("/api/admin/documents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: normalized.map((document) => ({
          id: document.id,
          order: document.order,
        })),
      }),
    });
  };

  const toggleEnabled = async (document: DocumentItem) => {
    await fetch(`/api/admin/documents/${document.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !document.enabled }),
    });
    await refresh();
  };

  const removeDocument = async (id: string) => {
    if (!confirm("Удалить документ?")) return;
    await fetch(`/api/admin/documents/${id}`, { method: "DELETE" });
    await refresh();
    toast.success("Документ удалён");
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Документы</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Раздел под политику, оферту, лицензии и другие обязательные файлы.
            Для документа можно назначить PDF или изображение из медиатеки.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId("new");
            setFormData(initialForm);
          }}
          className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
        >
          Добавить документ
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по названию..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
      />

      {editingId ? (
        <form
          onSubmit={submitForm}
          className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Название</span>
              <input
                value={formData.title}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, title: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Slug</span>
              <input
                value={formData.slug}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, slug: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Тип</span>
              <input
                value={formData.type}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, type: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Файл</span>
              <select
                value={formData.fileId}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, fileId: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              >
                <option value="">Файл не назначен</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    [{getDocumentFileLabel(file.mimeType)}] {file.label || file.path}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-6 text-slate-500">
                Сначала загрузите PDF или изображение в разделе «Медиа», затем
                привяжите его к документу здесь.
              </p>
            </label>
            <div className="md:col-span-2">
              <AiAssistPanel
                description="AI готовит название, описание и тип документа по текущему тексту и выбранному файлу. Номера лицензий, даты и юридические формулировки проверьте вручную."
                onGenerate={generateAiDraft}
                loading={aiGenerating}
              />
            </div>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Описание</span>
              <textarea
                value={formData.description}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            {selectedFile ? (
              <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-4 md:col-span-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Назначенный файл: {getDocumentFileLabel(selectedFile.mimeType)}
                  </p>
                  <p className="text-xs leading-6 text-slate-500">
                    {selectedFile.label || selectedFile.path}
                  </p>
                </div>
                {(selectedFile.mimeType || "").startsWith("image/") ? (
                  <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white">
                    <div className="relative aspect-[16/10] w-full">
                      <Image
                        src={selectedFile.path}
                        alt={selectedFile.label || "Изображение документа"}
                        fill
                        unoptimized={isUploadedMediaPath(selectedFile.path)}
                        sizes="(max-width: 768px) 100vw, 60vw"
                        className="object-contain bg-slate-100"
                      />
                    </div>
                  </div>
                ) : (
                  <a
                    href={selectedFile.path}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    Открыть PDF
                  </a>
                )}
              </div>
            ) : null}
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(event) =>
                setFormData((current) => ({ ...current, enabled: event.target.checked }))
              }
            />
            Документ опубликован
          </label>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4">
        {filteredDocuments.map((document) => (
          <article
            key={document.id}
            className="rounded-[1.8rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">
                    {document.title}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      document.enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {document.enabled ? "Опубликован" : "Черновик"}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{document.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>slug: {document.slug}</span>
                  <span>type: {document.type}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={documents.findIndex((d) => d.id === document.id) === 0}
                  onClick={() => moveDocument(document.id, -1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вверх
                </button>
                <button
                  type="button"
                  disabled={documents.findIndex((d) => d.id === document.id) === documents.length - 1}
                  onClick={() => moveDocument(document.id, 1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вниз
                </button>
                <button
                  type="button"
                  onClick={() => toggleEnabled(document)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {document.enabled ? "Скрыть" : "Показать"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(document)}
                  className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  onClick={() => removeDocument(document.id)}
                  className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                >
                  Удалить
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

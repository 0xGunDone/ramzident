"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import AiAssistPanel from "@/components/admin/AiAssistPanel";
import { requestAdminAiDraft } from "@/lib/admin-ai-client";
import type { TestimonialItem } from "@/types";

const initialForm = {
  author: "",
  role: "",
  quote: "",
  rating: 5,
  source: "",
  enabled: true,
};

export default function TestimonialsManager() {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [aiGenerating, setAiGenerating] = useState(false);

  interface TestimonialAiDraft {
    role?: string | null;
    quote?: string | null;
  }

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/admin/testimonials");
        const data = await response.json();
        setItems(data);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const refresh = async () => {
    const response = await fetch("/api/admin/testimonials");
    const data = await response.json();
    setItems(data);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const startEdit = (item: TestimonialItem) => {
    setEditingId(item.id);
    setFormData({
      author: item.author,
      role: item.role || "",
      quote: item.quote,
      rating: item.rating,
      source: item.source || "",
      enabled: item.enabled,
    });
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const isNew = editingId === "new";

    await fetch(
      isNew ? "/api/admin/testimonials" : `/api/admin/testimonials/${editingId}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );

    toast.success("Отзыв сохранён");
    await refresh();
    resetForm();
  };

  const generateAiDraft = async () => {
    if (!formData.quote.trim() && !formData.role.trim()) {
      toast.error("Для AI заполнения укажите текст отзыва или подпись");
      return;
    }

    setAiGenerating(true);

    try {
      const draft = await requestAdminAiDraft<TestimonialAiDraft>("testimonial", {
        author: formData.author || null,
        role: formData.role || null,
        quote: formData.quote || null,
        source: formData.source || null,
        rating: formData.rating,
      });

      setFormData((current) => ({
        ...current,
        role: draft.role ?? current.role,
        quote: draft.quote ?? current.quote,
      }));
      toast.success("AI подготовил черновик отзыва");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "AI заполнение недоступно"
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const moveItem = async (id: string, direction: -1 | 1) => {
    const index = items.findIndex((item) => item.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];

    const normalized = reordered.map((item, order) => ({ ...item, order }));
    setItems(normalized);

    await fetch("/api/admin/testimonials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testimonials: normalized.map((item) => ({ id: item.id, order: item.order })),
      }),
    });
  };

  const toggleEnabled = async (item: TestimonialItem) => {
    await fetch(`/api/admin/testimonials/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !item.enabled }),
    });
    await refresh();
  };

  const removeItem = async (id: string) => {
    if (!confirm("Удалить отзыв?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    toast.success("Отзыв удалён");
    await refresh();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Отзывы</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Здесь можно хранить аккуратно переработанные отзывы и социальные
            доказательства без статичных демо-цитат.
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
          Добавить отзыв
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по автору или тексту..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
      />

      {editingId ? (
        <form
          onSubmit={submitForm}
          className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <AiAssistPanel
                description="AI бережно вычищает отзыв и подпись на основе текущих полей формы. Имена пациентов, результаты лечения и другие детали перепроверьте перед публикацией."
                onGenerate={generateAiDraft}
                loading={aiGenerating}
                disabled={!formData.quote.trim() && !formData.role.trim()}
              />
            </div>
            <input
              value={formData.author}
              onChange={(event) =>
                setFormData((current) => ({ ...current, author: event.target.value }))
              }
              placeholder="Автор"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
            <input
              value={formData.role}
              onChange={(event) =>
                setFormData((current) => ({ ...current, role: event.target.value }))
              }
              placeholder="Подпись"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />
            <textarea
              value={formData.quote}
              onChange={(event) =>
                setFormData((current) => ({ ...current, quote: event.target.value }))
              }
              placeholder="Текст отзыва"
              className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2"
              required
            />
            <input
              type="number"
              min={1}
              max={5}
              value={formData.rating}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  rating: Number(event.target.value),
                }))
              }
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />
            <input
              value={formData.source}
              onChange={(event) =>
                setFormData((current) => ({ ...current, source: event.target.value }))
              }
              placeholder="Источник"
              className="rounded-2xl border border-slate-200 px-4 py-3"
            />
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(event) =>
                setFormData((current) => ({ ...current, enabled: event.target.checked }))
              }
            />
            Отзыв опубликован
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
        {items
          .filter(
            (item) =>
              item.author.toLowerCase().includes(search.toLowerCase()) ||
              item.quote.toLowerCase().includes(search.toLowerCase())
          )
          .map((item) => {
            const fullIndex = items.findIndex((i) => i.id === item.id);
            return (
          <article
            key={item.id}
            className="rounded-[1.8rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">{item.author}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {item.enabled ? "Опубликован" : "Скрыт"}
                  </span>
                </div>
                <p className="text-sm leading-7 text-slate-600">{item.quote}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={fullIndex === 0}
                  onClick={() => moveItem(item.id, -1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вверх
                </button>
                <button
                  type="button"
                  disabled={fullIndex === items.length - 1}
                  onClick={() => moveItem(item.id, 1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вниз
                </button>
                <button
                  type="button"
                  onClick={() => toggleEnabled(item)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {item.enabled ? "Скрыть" : "Показать"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700"
                >
                  Удалить
                </button>
              </div>
            </div>
          </article>
            );
          })}
      </div>
    </div>
  );
}

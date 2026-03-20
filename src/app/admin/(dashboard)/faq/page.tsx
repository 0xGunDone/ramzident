"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { FaqItem } from "@/types";

const initialForm = {
  question: "",
  answer: "",
  enabled: true,
};

export default function FAQManager() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);

  const filteredItems = items.filter(
    (item) =>
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/faq");
      const data = await response.json();
      setItems(data);
      setLoading(false);
    };

    load();
  }, []);

  const refresh = async () => {
    const response = await fetch("/api/admin/faq");
    const data = await response.json();
    setItems(data);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const startEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setFormData({
      question: item.question,
      answer: item.answer,
      enabled: item.enabled,
    });
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const isNew = editingId === "new";

    await fetch(isNew ? "/api/admin/faq" : `/api/admin/faq/${editingId}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    await refresh();
    resetForm();
    toast.success("Вопрос сохранён");
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

    await fetch("/api/admin/faq", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: normalized.map((item) => ({ id: item.id, order: item.order })),
      }),
    });
  };

  const toggleEnabled = async (item: FaqItem) => {
    await fetch(`/api/admin/faq/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !item.enabled }),
    });
    await refresh();
  };

  const removeItem = async (id: string) => {
    if (!confirm("Удалить вопрос?")) return;
    await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    await refresh();
    toast.success("Вопрос удалён");
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">FAQ</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Вопросы и ответы для публичного блока, который закрывает базовые
            организационные возражения пациента.
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
          Добавить вопрос
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по вопросу..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
      />

      {editingId ? (
        <form
          onSubmit={submitForm}
          className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
        >
          <div className="grid gap-4">
            <input
              value={formData.question}
              onChange={(event) =>
                setFormData((current) => ({ ...current, question: event.target.value }))
              }
              placeholder="Вопрос"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              required
            />
            <textarea
              value={formData.answer}
              onChange={(event) =>
                setFormData((current) => ({ ...current, answer: event.target.value }))
              }
              placeholder="Ответ"
              className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3"
              required
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
            Вопрос опубликован
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
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.8rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">
                    {item.question}
                  </h2>
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
                <p className="text-sm leading-7 text-slate-600">{item.answer}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={items.findIndex((i) => i.id === item.id) === 0}
                  onClick={() => moveItem(item.id, -1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вверх
                </button>
                <button
                  type="button"
                  disabled={items.findIndex((i) => i.id === item.id) === items.length - 1}
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
        ))}
      </div>
    </div>
  );
}

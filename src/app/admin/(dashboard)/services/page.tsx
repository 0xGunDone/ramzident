"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import AiAssistPanel from "@/components/admin/AiAssistPanel";
import { requestAdminAiDraft } from "@/lib/admin-ai-client";
import type { ServiceItem, MediaOption } from "@/types";

const initialForm = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  body: "",
  priceFrom: "",
  duration: "",
  icon: "spark",
  badge: "",
  seoTitle: "",
  seoDescription: "",
  photoId: "",
  enabled: true,
};

export default function ServicesManager() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [mediaList, setMediaList] = useState<MediaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [search, setSearch] = useState<string>("");
  const [aiGenerating, setAiGenerating] = useState(false);

  interface ServiceAiDraft {
    summary?: string | null;
    description?: string | null;
    body?: string | null;
    badge?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  }

  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(search.toLowerCase()) ||
      service.slug.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [servicesResponse, mediaResponse] = await Promise.all([
          fetch("/api/admin/services"),
          fetch("/api/admin/media"),
        ]);

        const servicesData = await servicesResponse.json();
        const mediaData = await mediaResponse.json();

        setServices(servicesData);
        setMediaList(
          mediaData.filter((item: { mimeType: string }) =>
            item.mimeType.startsWith("image/")
          )
        );
      } catch {
        toast.error("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const startCreate = () => {
    setEditingId("new");
    setFormData(initialForm);
  };

  const startEdit = (service: ServiceItem) => {
    setEditingId(service.id);
    setFormData({
      title: service.title,
      slug: service.slug,
      summary: service.summary || "",
      description: service.description,
      body: service.body || "",
      priceFrom: service.priceFrom || "",
      duration: service.duration || "",
      icon: service.icon || "spark",
      badge: service.badge || "",
      seoTitle: service.seoTitle || "",
      seoDescription: service.seoDescription || "",
      photoId: service.photoId || "",
      enabled: service.enabled,
    });
  };

  const refreshServices = async () => {
    const response = await fetch("/api/admin/services");
    const data = await response.json();
    setServices(data);
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...formData,
      photoId: formData.photoId || null,
    };

    const isNew = editingId === "new";
    const url = isNew ? "/api/admin/services" : `/api/admin/services/${editingId}`;
    const method = isNew ? "POST" : "PUT";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      toast.error("Не удалось сохранить");
      return;
    }

    await refreshServices();
    resetForm();
    toast.success("Услуга сохранена");
  };

  const generateAiDraft = async () => {
    if (!formData.title.trim()) {
      toast.error("Для AI заполнения укажите название услуги");
      return;
    }

    setAiGenerating(true);

    try {
      const draft = await requestAdminAiDraft<ServiceAiDraft>("service", {
        title: formData.title,
        summary: formData.summary || null,
        description: formData.description || null,
        body: formData.body || null,
        priceFrom: formData.priceFrom || null,
        duration: formData.duration || null,
        badge: formData.badge || null,
        seoTitle: formData.seoTitle || null,
        seoDescription: formData.seoDescription || null,
      });

      setFormData((current) => ({
        ...current,
        summary: draft.summary ?? current.summary,
        description: draft.description ?? current.description,
        body: draft.body ?? current.body,
        badge: draft.badge ?? current.badge,
        seoTitle: draft.seoTitle ?? current.seoTitle,
        seoDescription: draft.seoDescription ?? current.seoDescription,
      }));
      toast.success("AI подготовил черновик услуги");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "AI заполнение недоступно"
      );
    } finally {
      setAiGenerating(false);
    }
  };

  const moveService = async (id: string, direction: -1 | 1) => {
    const index = services.findIndex((service) => service.id === id);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= services.length) return;

    const reordered = [...services];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];

    const normalized = reordered.map((service, order) => ({ ...service, order }));
    setServices(normalized);
    setSavingOrder(true);

    try {
      const response = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: normalized.map((service) => ({
            id: service.id,
            order: service.order,
          })),
        }),
      });
      if (!response.ok) toast.error("Не удалось сохранить порядок");
    } catch {
      toast.error("Не удалось сохранить порядок");
    } finally {
      setSavingOrder(false);
    }
  };

  const toggleEnabled = async (service: ServiceItem) => {
    const response = await fetch(`/api/admin/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !service.enabled }),
    });

    if (!response.ok) {
      toast.error("Не удалось обновить статус");
      return;
    }
    await refreshServices();
  };

  const removeService = async (id: string) => {
    if (!confirm("Удалить услугу?")) return;

    const response = await fetch(`/api/admin/services/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Не удалось удалить");
      return;
    }
    await refreshServices();
    if (editingId === id) resetForm();
    toast.success("Услуга удалена");
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Услуги</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Здесь редактируются карточки услуг и страницы направлений: заголовки,
            описания, цены, продолжительность, фото и порядок вывода.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savingOrder ? (
            <span className="text-sm text-slate-500">Сохраняю порядок...</span>
          ) : null}
          <button
            type="button"
            onClick={startCreate}
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
          >
            Добавить услугу
          </button>
        </div>
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
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Краткое описание карточки</span>
              <textarea
                value={formData.summary}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, summary: event.target.value }))
                }
                className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <div className="md:col-span-2">
              <AiAssistPanel
                description="AI улучшает текст услуги только на основе текущих полей формы. Цены, длительность, методы и другие факты вручную проверьте перед публикацией."
                onGenerate={generateAiDraft}
                loading={aiGenerating}
                disabled={!formData.title.trim()}
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
                className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3"
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Текст страницы</span>
              <textarea
                value={formData.body}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, body: event.target.value }))
                }
                className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Цена от</span>
              <input
                value={formData.priceFrom}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    priceFrom: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Длительность</span>
              <input
                value={formData.duration}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    duration: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Иконка</span>
              <select
                value={formData.icon}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, icon: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              >
                <option value="spark">spark</option>
                <option value="heart">heart</option>
                <option value="shield">shield</option>
                <option value="crown">crown</option>
                <option value="align">align</option>
                <option value="smile">smile</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Бейдж</span>
              <input
                value={formData.badge}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, badge: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Фото услуги</span>
              <select
                value={formData.photoId}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, photoId: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              >
                <option value="">Без фото</option>
                {mediaList.map((media) => (
                  <option key={media.id} value={media.id}>
                    {media.label || media.path}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>SEO title</span>
              <input
                value={formData.seoTitle}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, seoTitle: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>SEO description</span>
              <input
                value={formData.seoDescription}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    seoDescription: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(event) =>
                setFormData((current) => ({ ...current, enabled: event.target.checked }))
              }
            />
            Услуга опубликована
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
        {filteredServices.map((service) => {
          const fullIndex = services.findIndex((s) => s.id === service.id);
          return (
          <article
            key={service.id}
            className="rounded-[1.8rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">{service.title}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      service.enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {service.enabled ? "Опубликовано" : "Скрыто"}
                  </span>
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  {service.summary || service.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>slug: {service.slug}</span>
                  {service.priceFrom ? <span>{service.priceFrom}</span> : null}
                  {service.duration ? <span>{service.duration}</span> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={fullIndex === 0}
                  onClick={() => moveService(service.id, -1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вверх
                </button>
                <button
                  type="button"
                  disabled={fullIndex === services.length - 1}
                  onClick={() => moveService(service.id, 1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вниз
                </button>
                <button
                  type="button"
                  onClick={() => toggleEnabled(service)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {service.enabled ? "Скрыть" : "Показать"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(service)}
                  className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
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

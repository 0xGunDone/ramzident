"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type { MediaOption } from "@/types";

interface SectionItem {
  id: string;
  type: string;
  title: string | null;
  order: number;
  enabled: boolean;
  content: string | null;
}

const sectionLabels: Record<string, string> = {
  hero: "Главный экран",
  about: "О клинике",
  services: "Услуги",
  doctors: "Врачи",
  gallery: "Галерея",
  testimonials: "Отзывы",
  faq: "FAQ",
  documents: "Документы",
  contacts: "Контакты",
};

type ContentMap = Record<string, unknown>;

function safeParse(json: string | null): ContentMap {
  if (!json) return {};
  try {
    return JSON.parse(json) as ContentMap;
  } catch {
    return {};
  }
}

function StringField({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
        />
      )}
    </label>
  );
}

function MediaSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: MediaOption[];
}) {
  const selectedOption = options.find((option) => option.path === value);

  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
      >
        <option value="">Не выбрано</option>
        {options.map((option) => (
          <option key={option.id} value={option.path}>
            {option.label || option.path}
          </option>
        ))}
      </select>
      {value ? (
        <div className="space-y-2">
          <p className="text-xs font-normal text-slate-500">
            Выбрано: {selectedOption?.label || value}
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="relative aspect-[16/9] w-full">
              <img
                src={value}
                alt={selectedOption?.label || "Выбранное изображение"}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="px-3 py-2 text-xs text-slate-500">
              {value}
            </div>
          </div>
        </div>
      ) : null}
    </label>
  );
}

function StringArrayField({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          + Добавить
        </button>
      </div>
    </div>
  );
}

function TrustItemsField({
  items,
  onChange,
}: {
  items: { value: string; label: string }[];
  onChange: (v: { value: string; label: string }[]) => void;
}) {
  return (
    <div className="space-y-2 text-sm font-medium text-slate-700">
      <span>Цифры доверия</span>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={item.value}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], value: e.target.value };
                onChange(next);
              }}
              placeholder="4.7"
              className="w-24 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <input
              value={item.label}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], label: e.target.value };
                onChange(next);
              }}
              placeholder="рейтинг в Яндекс Картах"
              className="flex-1 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, { value: "", label: "" }])}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
        >
          + Добавить
        </button>
      </div>
    </div>
  );
}

function HeroEditor({
  data,
  onChange,
  mediaOptions,
}: {
  data: ContentMap;
  onChange: (d: ContentMap) => void;
  mediaOptions: MediaOption[];
}) {
  const set = (key: string, value: unknown) => onChange({ ...data, [key]: value });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StringField label="Eyebrow (плашка)" value={String(data.eyebrow || "")} onChange={(v) => set("eyebrow", v)} />
      <MediaSelectField
        label="Изображение"
        value={String(data.imagePath || "")}
        onChange={(v) => set("imagePath", v)}
        options={mediaOptions}
      />
      <div className="md:col-span-2">
        <StringField label="Заголовок" value={String(data.title || "")} onChange={(v) => set("title", v)} />
      </div>
      <div className="md:col-span-2">
        <StringField label="Акцент (золотая строка)" value={String(data.accent || "")} onChange={(v) => set("accent", v)} />
      </div>
      <div className="md:col-span-2">
        <StringField label="Описание" value={String(data.description || "")} onChange={(v) => set("description", v)} multiline />
      </div>
      <StringField label="Текст главной кнопки" value={String(data.primaryLabel || "")} onChange={(v) => set("primaryLabel", v)} />
      <StringField label="Текст второй кнопки" value={String(data.secondaryLabel || "")} onChange={(v) => set("secondaryLabel", v)} />
      <div className="md:col-span-2">
        <StringArrayField label="Бейджи" items={Array.isArray(data.badges) ? data.badges as string[] : []} onChange={(v) => set("badges", v)} placeholder="Детская стоматология" />
      </div>
      <div className="md:col-span-2">
        <TrustItemsField
          items={Array.isArray(data.trustItems) ? data.trustItems as { value: string; label: string }[] : []}
          onChange={(v) => set("trustItems", v)}
        />
      </div>
    </div>
  );
}

function AboutEditor({
  data,
  onChange,
  mediaOptions,
}: {
  data: ContentMap;
  onChange: (d: ContentMap) => void;
  mediaOptions: MediaOption[];
}) {
  const set = (key: string, value: unknown) => onChange({ ...data, [key]: value });
  return (
    <div className="grid gap-4">
      <StringField label="Описание" value={String(data.description || "")} onChange={(v) => set("description", v)} multiline />
      <MediaSelectField
        label="Изображение"
        value={String(data.imagePath || "")}
        onChange={(v) => set("imagePath", v)}
        options={mediaOptions}
      />
      <StringArrayField label="Абзацы текста" items={Array.isArray(data.paragraphs) ? data.paragraphs as string[] : []} onChange={(v) => set("paragraphs", v)} placeholder="Текст абзаца..." />
      <StringArrayField label="Преимущества (с галочкой)" items={Array.isArray(data.highlights) ? data.highlights as string[] : []} onChange={(v) => set("highlights", v)} placeholder="Современное оборудование..." />
    </div>
  );
}

function TestimonialsEditor({ data, onChange }: { data: ContentMap; onChange: (d: ContentMap) => void }) {
  const set = (key: string, value: unknown) => onChange({ ...data, [key]: value });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StringField label="Рейтинг" value={String(data.rating || "")} onChange={(v) => set("rating", v)} placeholder="4.9" />
      <StringField label="Количество отзывов" value={String(data.reviewCount || "")} onChange={(v) => set("reviewCount", v)} placeholder="70+" />
      <StringField label="Источник" value={String(data.sourceLabel || "")} onChange={(v) => set("sourceLabel", v)} placeholder="Яндекс Карты" />
      <StringField label="Ссылка на источник" value={String(data.sourceUrl || "")} onChange={(v) => set("sourceUrl", v)} placeholder="https://yandex.ru/maps/..." />
    </div>
  );
}

function SimpleDescriptionEditor({ data, onChange }: { data: ContentMap; onChange: (d: ContentMap) => void }) {
  return (
    <StringField
      label="Описание секции"
      value={String(data.description || "")}
      onChange={(v) => onChange({ ...data, description: v })}
      multiline
    />
  );
}

function SectionContentEditor({
  type,
  data,
  onChange,
  mediaOptions,
}: {
  type: string;
  data: ContentMap;
  onChange: (d: ContentMap) => void;
  mediaOptions: MediaOption[];
}) {
  switch (type) {
    case "hero":
      return <HeroEditor data={data} onChange={onChange} mediaOptions={mediaOptions} />;
    case "about":
      return <AboutEditor data={data} onChange={onChange} mediaOptions={mediaOptions} />;
    case "testimonials":
      return <TestimonialsEditor data={data} onChange={onChange} />;
    case "services":
    case "doctors":
    case "gallery":
    case "faq":
    case "documents":
    case "contacts":
      return <SimpleDescriptionEditor data={data} onChange={onChange} />;
    default:
      return (
        <StringField
          label="JSON контент (произвольный тип)"
          value={JSON.stringify(data, null, 2)}
          onChange={(v) => {
            try { onChange(JSON.parse(v)); } catch { /* ignore */ }
          }}
          multiline
        />
      );
  }
}

export default function SectionsManager() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState("");
  const [title, setTitle] = useState("");
  const [contentData, setContentData] = useState<ContentMap>({});

  const load = useCallback(async () => {
    try {
      const [sectionsResponse, mediaResponse] = await Promise.all([
        fetch("/api/admin/sections"),
        fetch("/api/admin/media"),
      ]);
      const [sectionsData, mediaData] = await Promise.all([
        sectionsResponse.json(),
        mediaResponse.json(),
      ]);
      setSections(sectionsData);
      setMediaOptions(
        (mediaData as MediaOption[]).filter((item) =>
          (item.mimeType || "").startsWith("image/")
        )
      );
    } catch {
      toast.error("Не удалось загрузить секции");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const moveSection = async (id: string, direction: -1 | 1) => {
    const index = sections.findIndex((s) => s.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = [...sections];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const normalized = reordered.map((s, order) => ({ ...s, order }));
    setSections(normalized);

    await fetch("/api/admin/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sections: normalized.map((s) => ({ id: s.id, order: s.order })),
      }),
    });
  };

  const toggleSection = async (section: SectionItem) => {
    await fetch(`/api/admin/sections/${section.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !section.enabled }),
    });
    await load();
  };

  const startEdit = (section: SectionItem) => {
    setEditingId(section.id);
    setEditingType(section.type);
    setTitle(section.title || "");
    setContentData(safeParse(section.content));
  };

  const saveSection = async () => {
    if (!editingId) return;

    const response = await fetch(`/api/admin/sections/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content: JSON.stringify(contentData),
      }),
    });

    if (!response.ok) {
      toast.error("Не удалось сохранить");
      return;
    }

    toast.success("Секция сохранена");
    await load();
    setEditingId(null);
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Секции</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Порядок, публикация и контент секций главной страницы. Каждый тип
          секции имеет свои поля для удобного редактирования.
        </p>
      </div>

      {editingId ? (
        <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {sectionLabels[editingType] || editingType}
            </span>
          </div>
          <div className="grid gap-5">
            <StringField
              label="Заголовок секции"
              value={title}
              onChange={setTitle}
              placeholder="Отображается на главной странице"
            />

            <div className="border-t border-slate-100 pt-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Содержимое секции
              </p>
              <SectionContentEditor
                type={editingType}
                data={contentData}
                onChange={setContentData}
                mediaOptions={mediaOptions}
              />
            </div>

            <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={saveSection}
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
              >
                Сохранить секцию
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4">
        {sections.map((section, index) => (
          <article
            key={section.id}
            className="rounded-[1.8rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">
                    {sectionLabels[section.type] || section.type}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      section.enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {section.enabled ? "Включена" : "Выключена"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  title: {section.title || "не задан"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveSection(section.id, -1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вверх
                </button>
                <button
                  type="button"
                  disabled={index === sections.length - 1}
                  onClick={() => moveSection(section.id, 1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вниз
                </button>
                <button
                  type="button"
                  onClick={() => toggleSection(section)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {section.enabled ? "Выключить" : "Включить"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(section)}
                  className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                >
                  Редактировать
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

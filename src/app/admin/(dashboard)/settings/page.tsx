"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

const defaults = {
  clinicName: "Рамзи Дент",
  phone: "+7 903 808 01 40",
  phoneRaw: "+79038080140",
  email: "",
  address: "170006, Россия, Тверь, улица Брагина, 7",
  city: "Тверь",
  region: "Тверская область",
  postalCode: "170006",
  workHoursWeekdays: "10:00 - 19:00",
  workHoursWeekend: "10:00 - 15:00",
  mapCenterLat: "56.855939",
  mapCenterLng: "35.894276",
  mapPinLat: "56.855958248139",
  mapPinLng: "35.894215563158",
  mapZoom: "17",
  copyrightText: "",
  creatorName: "",
  creatorUrl: "",
  openRouterApiKey: "",
  openRouterModel: "qwen/qwen3-vl-30b-a3b-thinking",
};

export default function SettingsManager() {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/admin/settings");
        const data = await response.json();
        setSettings((current) => ({ ...current, ...data }));
      } catch {
        toast.error("Не удалось загрузить настройки");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateField = (key: keyof typeof defaults, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const { siteUrl: _siteUrl, ...payload } = settings as typeof defaults & {
        siteUrl?: string;
      };

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Настройки сохранены");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950">Настройки сайта</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Все настройки клиники хранятся в базе данных и редактируются здесь.
          Переменные окружения используются только как резервные значения, а
          домен сайта всегда берётся из `SITE_URL` на сервере.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Бренд и контакты</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Название клиники</span>
              <input
                value={settings.clinicName}
                onChange={(event) => updateField("clinicName", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Телефон</span>
              <input
                value={settings.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Телефон для ссылки `tel:`</span>
              <input
                value={settings.phoneRaw}
                onChange={(event) => updateField("phoneRaw", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Email</span>
              <input
                value={settings.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Адрес</span>
              <input
                value={settings.address}
                onChange={(event) => updateField("address", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Город</span>
              <input
                value={settings.city}
                onChange={(event) => updateField("city", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Регион</span>
              <input
                value={settings.region}
                onChange={(event) => updateField("region", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Индекс</span>
              <input
                value={settings.postalCode}
                onChange={(event) => updateField("postalCode", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Режим работы</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Пн-Пт</span>
              <input
                value={settings.workHoursWeekdays}
                onChange={(event) =>
                  updateField("workHoursWeekdays", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Сб-Вс</span>
              <input
                value={settings.workHoursWeekend}
                onChange={(event) =>
                  updateField("workHoursWeekend", event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Карта Яндекса</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Вместо iframe здесь используются координаты центра карты и координаты
            кастомного пина с логотипом клиники.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Центр карты: широта</span>
              <input
                value={settings.mapCenterLat}
                onChange={(event) => updateField("mapCenterLat", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Центр карты: долгота</span>
              <input
                value={settings.mapCenterLng}
                onChange={(event) => updateField("mapCenterLng", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Пин: широта</span>
              <input
                value={settings.mapPinLat}
                onChange={(event) => updateField("mapPinLat", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Пин: долгота</span>
              <input
                value={settings.mapPinLng}
                onChange={(event) => updateField("mapPinLng", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Zoom</span>
              <input
                value={settings.mapZoom}
                onChange={(event) => updateField("mapZoom", event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Копирайт и создатель</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Текст копирайта в подвале сайта. Если указан создатель — рядом
            появится ссылка на него.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Текст копирайта</span>
              <input
                value={settings.copyrightText}
                onChange={(event) =>
                  updateField("copyrightText", event.target.value)
                }
                placeholder="Оставьте пустым для стандартного «© 2026 Рамзи Дент. Все права защищены.»"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Имя / название создателя сайта</span>
              <input
                value={settings.creatorName}
                onChange={(event) =>
                  updateField("creatorName", event.target.value)
                }
                placeholder="Например: Студия дизайна"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Ссылка на создателя</span>
              <input
                value={settings.creatorUrl}
                onChange={(event) =>
                  updateField("creatorUrl", event.target.value)
                }
                placeholder="https://..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">AI / OpenRouter</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Ключ и модель для автоматической генерации alt-текстов и SEO-описаний
            изображений через OpenRouter API.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>API ключ OpenRouter</span>
              <input
                type="password"
                value={settings.openRouterApiKey}
                onChange={(event) =>
                  updateField("openRouterApiKey", event.target.value)
                }
                placeholder="sk-or-v1-..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-xs"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Модель OpenRouter</span>
              <input
                value={settings.openRouterModel}
                onChange={(event) =>
                  updateField("openRouterModel", event.target.value)
                }
                placeholder="qwen/qwen3-vl-30b-a3b-thinking"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-xs"
              />
            </label>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить настройки"}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DoctorItem, MediaOption } from "@/types";

const initialForm = {
  name: "",
  slug: "",
  speciality: "",
  experience: "",
  bio: "",
  education: "",
  schedule: "",
  photoId: "",
  enabled: true,
};

export default function DoctorsManager() {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [mediaList, setMediaList] = useState<MediaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const [doctorsResponse, mediaResponse] = await Promise.all([
          fetch("/api/admin/doctors"),
          fetch("/api/admin/media"),
        ]);

        const doctorsData = await doctorsResponse.json();
        const mediaData = await mediaResponse.json();

        setDoctors(doctorsData);
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

  const refreshDoctors = async () => {
    const response = await fetch("/api/admin/doctors");
    const data = await response.json();
    setDoctors(data);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const startEdit = (doctor: DoctorItem) => {
    setEditingId(doctor.id);
    setFormData({
      name: doctor.name,
      slug: doctor.slug,
      speciality: doctor.speciality,
      experience: doctor.experience || "",
      bio: doctor.bio || "",
      education: doctor.education || "",
      schedule: doctor.schedule || "",
      photoId: doctor.photoId || "",
      enabled: doctor.enabled,
    });
  };

  const startCreate = () => {
    setEditingId("new");
    setFormData(initialForm);
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const isNew = editingId === "new";

    const response = await fetch(
      isNew ? "/api/admin/doctors" : `/api/admin/doctors/${editingId}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          photoId: formData.photoId || null,
        }),
      }
    );

    if (!response.ok) {
      toast.error("Не удалось сохранить");
      return;
    }

    toast.success("Врач сохранён");
    await refreshDoctors();
    resetForm();
  };

  const moveDoctor = async (id: string, direction: -1 | 1) => {
    const index = doctors.findIndex((doctor) => doctor.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= doctors.length) return;

    const reordered = [...doctors];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];

    const normalized = reordered.map((doctor, order) => ({ ...doctor, order }));
    setDoctors(normalized);

    await fetch("/api/admin/doctors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctors: normalized.map((doctor) => ({
          id: doctor.id,
          order: doctor.order,
        })),
      }),
    });
  };

  const toggleEnabled = async (doctor: DoctorItem) => {
    const response = await fetch(`/api/admin/doctors/${doctor.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !doctor.enabled }),
    });

    if (!response.ok) return;
    await refreshDoctors();
  };

  const removeDoctor = async (id: string) => {
    if (!confirm("Удалить врача?")) return;

    const response = await fetch(`/api/admin/doctors/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Не удалось удалить");
      return;
    }
    toast.success("Врач удалён");
    await refreshDoctors();
    if (editingId === id) resetForm();
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">Врачи</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Управление составом команды: специализация, опыт, биография, график,
            фото, публикация и порядок на главной странице.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
        >
          Добавить врача
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск по имени или специальности..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
      />

      {editingId ? (
        <form
          onSubmit={submitForm}
          className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>ФИО</span>
              <input
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, name: event.target.value }))
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
              <span>Специальность</span>
              <input
                value={formData.speciality}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    speciality: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Стаж</span>
              <input
                value={formData.experience}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    experience: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Фото</span>
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
              <p className="text-xs leading-6 text-slate-500">
                Если нужно заменить сам файл без потери SEO и привязки к врачу,
                откройте запись в разделе «Медиа» и нажмите «Заменить файл».
              </p>
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Краткая биография</span>
              <textarea
                value={formData.bio}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, bio: event.target.value }))
                }
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Образование / квалификация</span>
              <textarea
                value={formData.education}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    education: event.target.value,
                  }))
                }
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Примечание по графику</span>
              <input
                value={formData.schedule}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    schedule: event.target.value,
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
            Врач опубликован
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
        {doctors
          .filter(
            (doctor) =>
              doctor.name.toLowerCase().includes(search.toLowerCase()) ||
              doctor.speciality.toLowerCase().includes(search.toLowerCase())
          )
          .map((doctor) => {
            const fullIndex = doctors.findIndex((d) => d.id === doctor.id);
            return (
          <article
            key={doctor.id}
            className="rounded-[1.8rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">{doctor.name}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      doctor.enabled
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {doctor.enabled ? "Опубликован" : "Скрыт"}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{doctor.speciality}</p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>slug: {doctor.slug}</span>
                  {doctor.experience ? <span>Стаж: {doctor.experience}</span> : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={fullIndex === 0}
                  onClick={() => moveDoctor(doctor.id, -1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вверх
                </button>
                <button
                  type="button"
                  disabled={fullIndex === doctors.length - 1}
                  onClick={() => moveDoctor(doctor.id, 1)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Вниз
                </button>
                <button
                  type="button"
                  onClick={() => toggleEnabled(doctor)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {doctor.enabled ? "Скрыть" : "Показать"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(doctor)}
                  className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  onClick={() => removeDoctor(doctor.id)}
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

export interface DoctorProfile {
  focusAreas: string[];
  bestFor: string;
  careStyle: string;
}

const focusAreaSplitPattern = /[\n,;]+/;

const doctorProfiles: Record<string, DoctorProfile> = {
  "nemeh-ramzi": {
    focusAreas: ["Терапия", "Ортодонтия", "Приём взрослых и детей"],
    bestFor:
      "Плановый осмотр, лечение кариеса, консультация по прикусу и длительное сопровождение.",
    careStyle:
      "Спокойно объясняет план лечения и помогает выстроить понятный маршрут для пациента.",
  },
  "gadzhikulieva-sirena": {
    focusAreas: ["Детский приём", "Профилактика", "Адаптация ребёнка"],
    bestFor:
      "Первое знакомство ребёнка со стоматологом, профилактика и лечение молочных зубов.",
    careStyle:
      "Делает акцент на мягкой коммуникации с ребёнком и комфортном формате посещения.",
  },
  "el-amin-rami": {
    focusAreas: ["Хирургия", "Имплантация", "Восстановление зубного ряда"],
    bestFor:
      "Удаление зубов, консультация по имплантации и выбор плана последующего восстановления.",
    careStyle:
      "Подбирает решение под клиническую задачу и заранее объясняет последовательность этапов.",
  },
};

const doctorProfilesByName: Record<string, DoctorProfile> = {
  "Немех Рамзи": doctorProfiles["nemeh-ramzi"],
  "Гаджикулиева Сирена": doctorProfiles["gadzhikulieva-sirena"],
  "Эль-Амин Рами": doctorProfiles["el-amin-rami"],
};

export function getDoctorProfile(slug: string, name?: string | null) {
  if (doctorProfiles[slug]) {
    return doctorProfiles[slug];
  }

  if (name && doctorProfilesByName[name]) {
    return doctorProfilesByName[name];
  }

  return undefined;
}

export function parseDoctorFocusAreas(value: string | null | undefined) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(focusAreaSplitPattern)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

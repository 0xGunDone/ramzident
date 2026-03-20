export interface DoctorProfile {
  focusAreas: string[];
  bestFor: string;
  careStyle: string;
}

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

export function getDoctorProfile(slug: string) {
  return doctorProfiles[slug];
}

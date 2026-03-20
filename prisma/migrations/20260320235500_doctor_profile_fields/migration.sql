ALTER TABLE "Doctor" ADD COLUMN "focusAreas" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "bestFor" TEXT;
ALTER TABLE "Doctor" ADD COLUMN "careStyle" TEXT;

UPDATE "Doctor"
SET
  "focusAreas" = CASE
    WHEN "focusAreas" IS NULL OR trim("focusAreas") = ''
      THEN 'Терапия' || char(10) || 'Ортодонтия' || char(10) || 'Приём взрослых и детей'
    ELSE "focusAreas"
  END,
  "bestFor" = CASE
    WHEN "bestFor" IS NULL OR trim("bestFor") = ''
      THEN 'Плановый осмотр, лечение кариеса, консультация по прикусу и длительное сопровождение.'
    ELSE "bestFor"
  END,
  "careStyle" = CASE
    WHEN "careStyle" IS NULL OR trim("careStyle") = ''
      THEN 'Спокойно объясняет план лечения и помогает выстроить понятный маршрут для пациента.'
    ELSE "careStyle"
  END
WHERE "slug" = 'nemeh-ramzi' OR "name" = 'Немех Рамзи';

UPDATE "Doctor"
SET
  "focusAreas" = CASE
    WHEN "focusAreas" IS NULL OR trim("focusAreas") = ''
      THEN 'Детский приём' || char(10) || 'Профилактика' || char(10) || 'Адаптация ребёнка'
    ELSE "focusAreas"
  END,
  "bestFor" = CASE
    WHEN "bestFor" IS NULL OR trim("bestFor") = ''
      THEN 'Первое знакомство ребёнка со стоматологом, профилактика и лечение молочных зубов.'
    ELSE "bestFor"
  END,
  "careStyle" = CASE
    WHEN "careStyle" IS NULL OR trim("careStyle") = ''
      THEN 'Делает акцент на мягкой коммуникации с ребёнком и комфортном формате посещения.'
    ELSE "careStyle"
  END
WHERE "slug" = 'gadzhikulieva-sirena' OR "name" = 'Гаджикулиева Сирена';

UPDATE "Doctor"
SET
  "focusAreas" = CASE
    WHEN "focusAreas" IS NULL OR trim("focusAreas") = ''
      THEN 'Хирургия' || char(10) || 'Имплантация' || char(10) || 'Восстановление зубного ряда'
    ELSE "focusAreas"
  END,
  "bestFor" = CASE
    WHEN "bestFor" IS NULL OR trim("bestFor") = ''
      THEN 'Удаление зубов, консультация по имплантации и выбор плана последующего восстановления.'
    ELSE "bestFor"
  END,
  "careStyle" = CASE
    WHEN "careStyle" IS NULL OR trim("careStyle") = ''
      THEN 'Подбирает решение под клиническую задачу и заранее объясняет последовательность этапов.'
    ELSE "careStyle"
  END
WHERE "slug" = 'el-amin-rami' OR "name" = 'Эль-Амин Рами';

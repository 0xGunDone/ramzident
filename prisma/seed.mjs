import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SEED_MODE_PRESERVE = "preserve";
const SEED_MODE_OVERWRITE = "overwrite";
const seedMode = (process.env.SEED_MODE || SEED_MODE_PRESERVE).trim().toLowerCase();

if (![SEED_MODE_PRESERVE, SEED_MODE_OVERWRITE].includes(seedMode)) {
  throw new Error(
    `Unsupported SEED_MODE="${seedMode}". Use "${SEED_MODE_PRESERVE}" or "${SEED_MODE_OVERWRITE}".`
  );
}

const shouldOverwriteExisting = seedMode === SEED_MODE_OVERWRITE;

const mediaItems = [
  {
    path: "/media/hero/clinic-hero.webp",
    filename: "clinic-hero.webp",
    label: "Главный экран клиники",
    altText: "Зона ожидания в стоматологической клинике Рамзи Дент",
    seoTitle: "Рамзи Дент в Твери",
    seoDescription:
      "Интерьер клиники Рамзи Дент в Твери на улице Брагина, 7.",
    context: "Hero image for the dental clinic homepage",
    usage: "hero",
  },
  {
    path: "/media/about/clinic-facade.webp",
    filename: "clinic-facade.webp",
    label: "Фасад клиники",
    altText: "Фасад стоматологической клиники Рамзи Дент",
    seoTitle: "Фасад клиники Рамзи Дент",
    seoDescription:
      "Входная группа стоматологической клиники Рамзи Дент в Твери.",
    context: "About section exterior photo",
    usage: "about",
  },
  {
    path: "/media/gallery/reception.webp",
    filename: "reception.webp",
    label: "Зона ожидания",
    altText: "Зона ожидания Рамзи Дент",
    seoTitle: "Зона ожидания Рамзи Дент",
    seoDescription:
      "Комфортная зона ожидания для взрослых и детей в клинике Рамзи Дент.",
    context: "Gallery image",
    usage: "gallery",
  },
  {
    path: "/media/gallery/interior.webp",
    filename: "interior.webp",
    label: "Интерьер клиники",
    altText: "Интерьер стоматологической клиники Рамзи Дент",
    seoTitle: "Интерьер клиники Рамзи Дент",
    seoDescription:
      "Светлый интерьер клиники и современная стоматологическая мебель.",
    context: "Gallery image",
    usage: "gallery",
  },
  {
    path: "/media/gallery/clinic-hall.webp",
    filename: "clinic-hall.webp",
    label: "Пространство клиники",
    altText: "Холл стоматологической клиники Рамзи Дент",
    seoTitle: "Пространство клиники Рамзи Дент",
    seoDescription:
      "Современное пространство клиники с продуманной навигацией и отделкой.",
    context: "Gallery image",
    usage: "gallery",
  },
  {
    path: "/media/gallery/facade-front.webp",
    filename: "facade-front.webp",
    label: "Вход в клинику",
    altText: "Вход в стоматологическую клинику Рамзи Дент",
    seoTitle: "Вход в Рамзи Дент",
    seoDescription:
      "Фото фасада и входа стоматологической клиники Рамзи Дент.",
    context: "Gallery image",
    usage: "gallery",
  },
  {
    path: "/media/gallery/treatment-room.webp",
    filename: "treatment-room.webp",
    label: "Кабинет лечения",
    altText: "Стоматологический кабинет в клинике Рамзи Дент",
    seoTitle: "Кабинет лечения Рамзи Дент",
    seoDescription:
      "Современный стоматологический кабинет с оборудованным рабочим местом.",
    context: "Gallery image",
    usage: "gallery",
  },
  {
    path: "/media/doctors/nemeh-ramzi.webp",
    filename: "nemeh-ramzi.webp",
    label: "Немех Рамзи",
    altText: "Доктор Немех Рамзи",
    seoTitle: "Немех Рамзи",
    seoDescription:
      "Доктор Немех Рамзи, стоматолог общей практики и детский ортодонт.",
    context: "Doctor portrait",
    usage: "doctor",
  },
  {
    path: "/media/doctors/gadzhikulieva-sirena.webp",
    filename: "gadzhikulieva-sirena.webp",
    label: "Гаджикулиева Сирена",
    altText: "Доктор Гаджикулиева Сирена",
    seoTitle: "Гаджикулиева Сирена",
    seoDescription:
      "Детский стоматолог Гаджикулиева Сирена в клинике Рамзи Дент.",
    context: "Doctor portrait",
    usage: "doctor",
  },
  {
    path: "/media/doctors/el-amin-rami.webp",
    filename: "el-amin-rami.webp",
    label: "Эль-Амин Рами",
    altText: "Доктор Эль-Амин Рами",
    seoTitle: "Эль-Амин Рами",
    seoDescription:
      "Стоматолог хирург-имплантолог Эль-Амин Рами в клинике Рамзи Дент.",
    context: "Doctor portrait",
    usage: "doctor",
  },
];

const siteSettings = {
  clinicName: process.env.SITE_NAME || "Рамзи Дент",
  phone: process.env.SITE_PHONE || "+7 903 808 01 40",
  phoneRaw: process.env.SITE_PHONE_RAW || "+79038080140",
  email: process.env.SITE_EMAIL || "",
  address:
    process.env.SITE_ADDRESS || "170006, Россия, Тверь, улица Брагина, 7",
  city: process.env.SITE_CITY || "Тверь",
  region: process.env.SITE_REGION || "Тверская область",
  postalCode: process.env.SITE_POSTAL_CODE || "170006",
  workHoursWeekdays: process.env.WORK_HOURS_WEEKDAYS || "10:00 - 19:00",
  workHoursWeekend: process.env.WORK_HOURS_WEEKEND || "10:00 - 15:00",
  mapCenterLat: process.env.YANDEX_MAP_CENTER_LAT || "56.855939",
  mapCenterLng: process.env.YANDEX_MAP_CENTER_LNG || "35.894276",
  mapPinLat: process.env.YANDEX_MAP_PIN_LAT || "56.855958248139",
  mapPinLng: process.env.YANDEX_MAP_PIN_LNG || "35.894215563158",
  mapZoom: process.env.YANDEX_MAP_ZOOM || "17",
  yandexMapsApiKey: process.env.YANDEX_MAPS_API_KEY || "",
  yandexMetrikaId: process.env.YANDEX_METRIKA_ID || "",
  googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || "",
  siteUrl: process.env.SITE_URL || "https://ramzident.ru",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel:
    process.env.OPENROUTER_MODEL || "qwen/qwen3-vl-30b-a3b-thinking",
};

const sections = [
  {
    type: "hero",
    title: "Главный экран",
    order: 0,
    enabled: true,
    content: {
      eyebrow: "Стоматология на улице Брагина",
      title: "Стоматология для взрослых и детей",
      accent: "с понятным маршрутом лечения и записью по телефону",
      description:
        "Стоматологическая клиника «Рамзи Дент» в Твери: терапия, детский приём, хирургия, имплантация, ортодонтия и эстетическая стоматология в одном месте.",
      primaryLabel: "Позвонить и записаться",
      secondaryLabel: "Посмотреть услуги",
      imagePath: "/media/hero/clinic-hero.webp",
      trustItems: [
        { value: "6", label: "ключевых направлений лечения" },
        { value: "1 звонок", label: "для записи и подбора врача" },
        { value: "33 года", label: "клинический стаж врача" },
      ],
      badges: [
        "Детская стоматология",
        "Имплантация",
        "Ортодонтия",
      ],
    },
  },
  {
    type: "about",
    title: "О клинике",
    order: 1,
    enabled: true,
    content: {
      description:
        "Стоматология «Рамзи Дент» сочетает современные методы лечения, аккуратный подход и комфортный сервис для взрослых и детей.",
      paragraphs: [
        "В клинике можно пройти основные стоматологические этапы в одном месте: от профилактики и терапевтического лечения до хирургии, имплантации, ортодонтии и эстетических процедур.",
        "Отдельное внимание уделяется спокойной коммуникации с пациентом: врачу важно подробно объяснить план лечения, сроки и дальнейшие рекомендации по уходу.",
      ],
      imagePath: "/media/about/clinic-facade.webp",
      highlights: [
        "Терапия, хирургия, имплантация и ортодонтия",
        "Детский приём и бережная коммуникация",
        "Профессиональная гигиена и эстетика улыбки",
        "Понятный маршрут лечения и запись по телефону",
      ],
    },
  },
  {
    type: "services",
    title: "Услуги",
    order: 2,
    enabled: true,
    content: {
      description:
        "Основные направления клиники: терапия, детская стоматология, хирургия, имплантация, ортодонтия и эстетическая стоматология.",
    },
  },
  {
    type: "doctors",
    title: "Врачи",
    order: 3,
    enabled: true,
    content: {
      description:
        "Врачи клиники работают со взрослыми и детьми, объясняют план лечения простым языком и сопровождают пациента на каждом этапе.",
    },
  },
  {
    type: "gallery",
    title: "Клиника",
    order: 4,
    enabled: true,
    content: {
      description:
        "Фотографии фасада, кабинетов и интерьера стоматологической клиники.",
    },
  },
  {
    type: "testimonials",
    title: "Что отмечают пациенты",
    order: 5,
    enabled: true,
    content: {
      sourceLabel: "Яндекс Карты",
      sourceUrl:
        "https://yandex.ru/maps/org/ramzi_dent/180026503415/?ll=35.894276%2C56.855939&z=14",
    },
  },
  {
    type: "faq",
    title: "Частые вопросы",
    order: 6,
    enabled: true,
    content: {
      description:
        "Ответы на частые вопросы о записи, режиме работы и основных направлениях лечения.",
    },
  },
  {
    type: "documents",
    title: "Документы",
    order: 7,
    enabled: true,
    content: {
      description:
        "Лицензии, политика обработки данных и другая обязательная информация клиники.",
    },
  },
  {
    type: "contacts",
    title: "Контакты",
    order: 8,
    enabled: true,
    content: {
      description:
        "Свяжитесь с клиникой по телефону, чтобы записаться на консультацию или лечение.",
    },
  },
];

const services = [
  {
    title: "Терапия и лечение кариеса",
    slug: "terapiya-i-lechenie-kariesa",
    summary:
      "Диагностика, лечение кариеса, восстановление зубов и эндодонтическое лечение по показаниям.",
    description:
      "Консультация, лечение кариеса, пломбирование, лечение каналов и восстановление зубов.",
    body: [
      "Терапевтическое направление помогает убрать боль, остановить развитие кариеса и сохранить зуб, когда важны аккуратное лечение и понятный прогноз.",
      "На приёме врач оценивает состояние зубов и тканей, при необходимости назначает диагностику и подбирает объём лечения: от пломбирования до эндодонтического лечения каналов.",
      "После лечения пациент получает рекомендации по уходу и дальнейшей профилактике, чтобы сохранить результат надолго.",
    ].join("\n\n"),
    priceFrom: "от 3 500 ₽",
    duration: "от 40 минут",
    icon: "spark",
    badge: "Терапия",
    seoTitle: "Лечение кариеса и терапия зубов в Твери",
    seoDescription:
      "Терапевтическая стоматология в Твери: лечение кариеса, пломбирование, эндодонтия и восстановление зубов в клинике Рамзи Дент.",
    photoPath: "/media/gallery/treatment-room.webp",
    order: 0,
    enabled: true,
  },
  {
    title: "Детская стоматология",
    slug: "detskaya-stomatologiya",
    summary:
      "Бережный приём для детей: профилактика, лечение молочных и постоянных зубов, адаптация к стоматологу.",
    description:
      "Детский стоматолог, профилактика, лечение кариеса и бережная адаптация ребёнка к приёму.",
    body: [
      "Детская стоматология в клинике построена на спокойном контакте с ребёнком, понятных объяснениях и аккуратном лечении без лишнего стресса.",
      "Врач проводит профилактические осмотры, лечит молочные и постоянные зубы, помогает вовремя заметить проблему и сохранить здоровье полости рта.",
      "При записи можно заранее уточнить возраст ребёнка, причину обращения и удобное время приёма.",
    ].join("\n\n"),
    priceFrom: "от 2 800 ₽",
    duration: "от 30 минут",
    icon: "heart",
    badge: "Детский приём",
    seoTitle: "Детская стоматология в Твери",
    seoDescription:
      "Детский стоматолог в Твери: профилактика, лечение молочных и постоянных зубов, бережный приём в клинике Рамзи Дент.",
    photoPath: "/media/gallery/interior.webp",
    order: 1,
    enabled: true,
  },
  {
    title: "Хирургия и удаление зубов",
    slug: "khirurgiya-i-udalenie-zubov",
    summary:
      "Удаление зубов, хирургические манипуляции и подготовка к дальнейшему восстановлению.",
    description:
      "Хирургическая стоматология: удаление зубов, консультации и подготовка к имплантации.",
    body: [
      "Хирургическое направление включает удаление зубов по показаниям, подготовку к последующему лечению и решение сложных клинических задач.",
      "Перед вмешательством врач проводит осмотр, объясняет этапы процедуры и рекомендует оптимальный вариант восстановления после удаления.",
      "При необходимости хирургический приём сочетается с дальнейшим имплантологическим или ортопедическим лечением.",
    ].join("\n\n"),
    priceFrom: "от 4 500 ₽",
    duration: "от 45 минут",
    icon: "shield",
    badge: "Хирургия",
    seoTitle: "Хирургическая стоматология в Твери",
    seoDescription:
      "Хирургическая стоматология в Твери: удаление зубов, подготовка к имплантации и консультации в клинике Рамзи Дент.",
    photoPath: "/media/gallery/treatment-room.webp",
    order: 2,
    enabled: true,
  },
  {
    title: "Имплантация и протезирование",
    slug: "implantatsiya-i-protezirovanie",
    summary:
      "Имплантация, коронки и ортопедическое восстановление зубного ряда после утраты зубов.",
    description:
      "Имплантация зубов, коронки и протезирование для восстановления жевательной функции и эстетики.",
    body: [
      "Имплантация и протезирование помогают восстановить отсутствующие зубы, вернуть комфорт при жевании и естественный вид улыбки.",
      "План лечения формируется после осмотра и диагностики: врач оценивает клиническую ситуацию, предлагает варианты восстановления и объясняет сроки этапов.",
      "В клинике можно получить консультацию по имплантации, коронкам и ортопедическому лечению в одном маршруте.",
    ].join("\n\n"),
    priceFrom: "от 18 000 ₽",
    duration: "по плану лечения",
    icon: "crown",
    badge: "Имплантация",
    seoTitle: "Имплантация зубов и протезирование в Твери",
    seoDescription:
      "Имплантация зубов, коронки и протезирование в Твери. Консультация и восстановление зубного ряда в клинике Рамзи Дент.",
    photoPath: "/media/gallery/clinic-hall.webp",
    order: 3,
    enabled: true,
  },
  {
    title: "Ортодонтия и брекеты",
    slug: "ortodontiya-i-brekety",
    summary:
      "Исправление прикуса, брекеты и ортодонтическое сопровождение взрослых и детей.",
    description:
      "Ортодонтия, брекет-системы и коррекция прикуса по индивидуальному плану лечения.",
    body: [
      "Ортодонтическое лечение помогает выровнять зубной ряд, скорректировать прикус и улучшить эстетику улыбки.",
      "На консультации врач оценивает клиническую ситуацию, рассказывает о возможных вариантах коррекции и ориентирует по срокам лечения.",
      "Направление подходит взрослым и детям, когда нужна плановая коррекция прикуса и длительное сопровождение специалиста.",
    ].join("\n\n"),
    priceFrom: "от 12 000 ₽",
    duration: "по плану лечения",
    icon: "align",
    badge: "Ортодонтия",
    seoTitle: "Ортодонтия и брекеты в Твери",
    seoDescription:
      "Ортодонтия и брекеты в Твери: консультация, коррекция прикуса и сопровождение взрослых и детей в клинике Рамзи Дент.",
    photoPath: "/media/gallery/facade-front.webp",
    order: 4,
    enabled: true,
  },
  {
    title: "Эстетическая стоматология и гигиена",
    slug: "esteticheskaya-stomatologiya-i-gigiena",
    summary:
      "Профессиональная гигиена, отбеливание и эстетические решения для здоровой и ухоженной улыбки.",
    description:
      "Профгигиена, отбеливание и эстетическая стоматология для профилактики и улучшения внешнего вида улыбки.",
    body: [
      "Эстетическое направление включает профессиональную гигиену, отбеливание и процедуры, которые помогают поддерживать зубы здоровыми и ухоженными.",
      "Врач оценивает состояние эмали и дёсен, подбирает подходящий объём ухода и рекомендует решения под эстетическую задачу.",
      "Такие процедуры часто становятся частью профилактики или подготовительным этапом перед дальнейшим лечением.",
    ].join("\n\n"),
    priceFrom: "от 4 000 ₽",
    duration: "от 40 минут",
    icon: "smile",
    badge: "Эстетика",
    seoTitle: "Эстетическая стоматология и гигиена в Твери",
    seoDescription:
      "Профессиональная гигиена, отбеливание и эстетическая стоматология в Твери в клинике Рамзи Дент.",
    photoPath: "/media/gallery/reception.webp",
    order: 5,
    enabled: true,
  },
];

const doctors = [
  {
    name: "Немех Рамзи",
    slug: "nemeh-ramzi",
    speciality: "Стоматолог общей практики, ортодонт",
    experience: "33 года",
    bio: "Ведёт терапевтический и ортодонтический приём, работает со взрослыми и детьми, делает акцент на понятном плане лечения и аккуратном сопровождении пациента.",
    education:
      "Многолетний клинический опыт в лечении и сопровождении пациентов разного возраста.",
    schedule:
      "График приёма уточняйте по телефону клиники.",
    photoPath: "/media/doctors/nemeh-ramzi.webp",
    order: 0,
    enabled: true,
  },
  {
    name: "Гаджикулиева Сирена",
    slug: "gadzhikulieva-sirena",
    speciality: "Детский стоматолог",
    experience: null,
    bio: "Специализируется на профилактике, лечении молочных и постоянных зубов и бережной адаптации ребёнка к стоматологическому приёму.",
    education:
      "В работе делает акцент на мягкой коммуникации с ребёнком и спокойном знакомстве с лечением.",
    schedule:
      "Для записи ребёнка лучше заранее согласовать удобное время приёма.",
    photoPath: "/media/doctors/gadzhikulieva-sirena.webp",
    order: 1,
    enabled: true,
  },
  {
    name: "Эль-Амин Рами",
    slug: "el-amin-rami",
    speciality: "Стоматолог, хирург-имплантолог",
    experience: null,
    bio: "Ведёт хирургический приём, удаление зубов и консультации по имплантации, подбирая решение под клиническую задачу пациента.",
    education:
      "Подбирает план лечения с учётом клинической ситуации и последующего восстановления зубного ряда.",
    schedule:
      "Для хирургической консультации и имплантации лучше записываться заранее.",
    photoPath: "/media/doctors/el-amin-rami.webp",
    order: 2,
    enabled: true,
  },
];

const testimonials = [
  {
    author: "Детский приём",
    role: "Отзывы пациентов",
    quote:
      "Родители отмечают спокойный контакт с ребёнком, бережную коммуникацию и комфортную атмосферу на приёме.",
    rating: 5,
    source: "Яндекс Карты",
    order: 0,
    enabled: true,
  },
  {
    author: "Лечение и хирургия",
    role: "Отзывы пациентов",
    quote:
      "Пациенты ценят аккуратную работу врачей, понятные объяснения и уверенное сопровождение на каждом этапе лечения.",
    rating: 5,
    source: "Яндекс Карты",
    order: 1,
    enabled: true,
  },
  {
    author: "Сервис и атмосфера",
    role: "Отзывы пациентов",
    quote:
      "В отзывах часто отмечают доброжелательное отношение, чистоту клиники и ощущение спокойствия во время визита.",
    rating: 5,
    source: "Яндекс Карты",
    order: 2,
    enabled: true,
  },
];

const faqs = [
  {
    question: "Как записаться на приём?",
    answer:
      "Запись ведётся по телефону +7 903 808 01 40. Администратор поможет выбрать удобное время и сориентирует по первичному визиту.",
    order: 0,
    enabled: true,
  },
  {
    question: "Клиника принимает детей?",
    answer:
      "Да. В клинике ведётся детский приём, профилактика и лечение молочных и постоянных зубов.",
    order: 1,
    enabled: true,
  },
  {
    question: "Какие направления доступны в клинике?",
    answer:
      "Ключевые направления: терапия, эндодонтия, детская стоматология, ортодонтия, хирургия, имплантология, протезирование, гигиена, отбеливание и эстетическая стоматология.",
    order: 2,
    enabled: true,
  },
  {
    question: "Какой режим работы у клиники?",
    answer:
      "Понедельник-пятница: 10:00-19:00. Суббота-воскресенье: 10:00-15:00.",
    order: 3,
    enabled: true,
  },
  {
    question: "Есть ли оплата картой и другие удобства?",
    answer:
      "Актуальные организационные детали, способы оплаты и дополнительные условия можно уточнить по телефону при записи.",
    order: 4,
    enabled: true,
  },
];

const documents = [
  {
    title: "Политика обработки персональных данных",
    slug: "privacy-policy",
    description:
      "Официальный документ о порядке обработки персональных данных пациентов.",
    type: "policy",
    filePath: null,
    order: 0,
    enabled: false,
  },
  {
    title: "Публичная оферта",
    slug: "public-offer",
    description:
      "Условия оказания стоматологических услуг и порядок взаимодействия с пациентами.",
    type: "offer",
    filePath: null,
    order: 1,
    enabled: false,
  },
  {
    title: "Лицензии и разрешительные документы",
    slug: "licenses",
    description:
      "Лицензии и иные разрешительные документы стоматологической клиники.",
    type: "license",
    filePath: null,
    order: 2,
    enabled: false,
  },
];

const getFileMeta = async (publicPath) => {
  const absolutePath = path.join(process.cwd(), "public", publicPath);
  const stats = await fs.stat(absolutePath);
  const metadata = await sharp(absolutePath).metadata();

  return {
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    sizeBytes: stats.size,
    mimeType: publicPath.endsWith(".png") ? "image/png" : "image/webp",
  };
};

async function createOrUpdateSeedRecord({
  delegate,
  where,
  createData,
  updateData,
}) {
  const existing = await delegate.findUnique({ where });

  if (!existing) {
    await delegate.create({ data: createData });
    return "created";
  }

  if (!shouldOverwriteExisting) {
    return "skipped";
  }

  await delegate.update({
    where,
    data: updateData,
  });
  return "updated";
}

async function replaceOrCreateCollection({
  delegate,
  data,
}) {
  const count = await delegate.count();

  if (count === 0) {
    await delegate.createMany({ data });
    return "created";
  }

  if (!shouldOverwriteExisting) {
    return "skipped";
  }

  await delegate.deleteMany();
  await delegate.createMany({ data });
  return "replaced";
}

async function upsertSettings() {
  for (const [key, value] of Object.entries(siteSettings)) {
    await createOrUpdateSeedRecord({
      delegate: prisma.siteSettings,
      where: { key },
      createData: { key, value: String(value) },
      updateData: { value: String(value) },
    });
  }
}

async function upsertMedia() {
  for (const item of mediaItems) {
    const meta = await getFileMeta(item.path);

    await createOrUpdateSeedRecord({
      delegate: prisma.media,
      where: { path: item.path },
      createData: {
        filename: item.filename,
        label: item.label,
        path: item.path,
        width: meta.width,
        height: meta.height,
        sizeBytes: meta.sizeBytes,
        mimeType: meta.mimeType,
        altText: item.altText,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        context: item.context,
        usage: item.usage,
      },
      updateData: {
        filename: item.filename,
        label: item.label,
        width: meta.width,
        height: meta.height,
        sizeBytes: meta.sizeBytes,
        mimeType: meta.mimeType,
        altText: item.altText,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        context: item.context,
        usage: item.usage,
      },
    });
  }
}

async function upsertSections() {
  for (const section of sections) {
    await createOrUpdateSeedRecord({
      delegate: prisma.section,
      where: { type: section.type },
      createData: {
        type: section.type,
        title: section.title,
        order: section.order,
        enabled: section.enabled,
        content: JSON.stringify(section.content),
      },
      updateData: {
        title: section.title,
        order: section.order,
        enabled: section.enabled,
        content: JSON.stringify(section.content),
      },
    });
  }
}

async function upsertAdminUser() {
  const email = process.env.ADMIN_EMAIL || "admin@ramzident.ru";
  const password = process.env.ADMIN_PASSWORD || "ramziDent001!";
  const passwordHash = await bcrypt.hash(password, 10);

  await createOrUpdateSeedRecord({
    delegate: prisma.adminUser,
    where: { email },
    createData: { email, password: passwordHash },
    updateData: { password: passwordHash },
  });
}

async function upsertServices() {
  const serviceSection = await prisma.section.findUnique({
    where: { type: "services" },
  });

  const mediaByPath = new Map(
    (await prisma.media.findMany()).map((item) => [item.path, item.id])
  );

  for (const service of services) {
    await createOrUpdateSeedRecord({
      delegate: prisma.service,
      where: { slug: service.slug },
      createData: {
        title: service.title,
        slug: service.slug,
        summary: service.summary,
        description: service.description,
        body: service.body,
        priceFrom: service.priceFrom,
        duration: service.duration,
        icon: service.icon,
        badge: service.badge,
        seoTitle: service.seoTitle,
        seoDescription: service.seoDescription,
        photoId: mediaByPath.get(service.photoPath) || null,
        order: service.order,
        enabled: service.enabled,
        sectionId: serviceSection?.id || null,
      },
      updateData: {
        title: service.title,
        summary: service.summary,
        description: service.description,
        body: service.body,
        priceFrom: service.priceFrom,
        duration: service.duration,
        icon: service.icon,
        badge: service.badge,
        seoTitle: service.seoTitle,
        seoDescription: service.seoDescription,
        photoId: mediaByPath.get(service.photoPath) || null,
        order: service.order,
        enabled: service.enabled,
        sectionId: serviceSection?.id || null,
      },
    });
  }
}

async function upsertDoctors() {
  const mediaByPath = new Map(
    (await prisma.media.findMany()).map((item) => [item.path, item.id])
  );

  for (const doctor of doctors) {
    await createOrUpdateSeedRecord({
      delegate: prisma.doctor,
      where: { slug: doctor.slug },
      createData: {
        name: doctor.name,
        slug: doctor.slug,
        speciality: doctor.speciality,
        experience: doctor.experience,
        bio: doctor.bio,
        education: doctor.education,
        schedule: doctor.schedule,
        photoId: mediaByPath.get(doctor.photoPath) || null,
        order: doctor.order,
        enabled: doctor.enabled,
      },
      updateData: {
        name: doctor.name,
        speciality: doctor.speciality,
        experience: doctor.experience,
        bio: doctor.bio,
        education: doctor.education,
        schedule: doctor.schedule,
        photoId: mediaByPath.get(doctor.photoPath) || null,
        order: doctor.order,
        enabled: doctor.enabled,
      },
    });
  }
}

async function replaceTestimonials() {
  await replaceOrCreateCollection({
    delegate: prisma.testimonial,
    data: testimonials,
  });
}

async function replaceFaqs() {
  await replaceOrCreateCollection({
    delegate: prisma.faqItem,
    data: faqs,
  });
}

async function upsertDocuments() {
  const mediaByPath = new Map(
    (await prisma.media.findMany()).map((item) => [item.path, item.id])
  );

  for (const document of documents) {
    await createOrUpdateSeedRecord({
      delegate: prisma.siteDocument,
      where: { slug: document.slug },
      createData: {
        title: document.title,
        slug: document.slug,
        description: document.description,
        type: document.type,
        fileId: document.filePath ? mediaByPath.get(document.filePath) || null : null,
        order: document.order,
        enabled: document.enabled,
      },
      updateData: {
        title: document.title,
        description: document.description,
        type: document.type,
        fileId: document.filePath ? mediaByPath.get(document.filePath) || null : null,
        order: document.order,
        enabled: document.enabled,
      },
    });
  }
}

async function main() {
  console.log(
    `[seed] Running in ${seedMode} mode${shouldOverwriteExisting ? " (existing content may be updated)" : " (existing content will be preserved)"}`
  );
  await upsertAdminUser();
  await upsertSettings();
  await upsertMedia();
  await upsertSections();
  await upsertServices();
  await upsertDoctors();
  await replaceTestimonials();
  await replaceFaqs();
  await upsertDocuments();
  console.log(
    shouldOverwriteExisting
      ? "[seed] Done. Existing records were synchronized from seed defaults."
      : "[seed] Done. Only missing seed records were created; existing content was left untouched."
  );
  if (!shouldOverwriteExisting) {
    console.log(
      '[seed] Use "npm run db:seed:overwrite" when you intentionally want to sync existing records back to the seed defaults.'
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

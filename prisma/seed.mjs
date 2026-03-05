import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      title: "Спокойное лечение для взрослых и детей",
      accent: "с понятным сервисом и современным подходом",
      description:
        "«Рамзи Дент» в Твери объединяет терапию, детский приём, ортодонтию, хирургию, имплантацию и эстетическую стоматологию в одной клинике.",
      primaryLabel: "Позвонить и записаться",
      secondaryLabel: "Посмотреть услуги",
      imagePath: "/media/hero/clinic-hero.webp",
      trustItems: [
        { value: "4.7", label: "рейтинг в Яндекс Картах" },
        { value: "41", label: "актуальный отзыв на 5 марта 2026" },
        { value: "33 года", label: "стаж доктора Немеха Рамзи" },
      ],
      badges: [
        "Детская стоматология",
        "Оплата картой",
        "Гарантия на работы",
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
        "Стоматология «Рамзи Дент» — клиника в Твери, где высокая квалификация врачей сочетается с современным оборудованием, спокойной атмосферой и понятным сервисом для взрослых и детей.",
      paragraphs: [
        "В клинике делают ставку на аккуратное лечение, безопасные материалы и уважительное отношение к пациенту на каждом этапе — от консультации до контроля результата.",
        "На основе данных Яндекс Карт клиника работает с детским кабинетом, принимает оплату картой, предоставляет Wi‑Fi, гарантию и поддерживает комфортный сервис для пациентов и сопровождающих.",
      ],
      imagePath: "/media/about/clinic-facade.webp",
      highlights: [
        "Современное оборудование и цифровая диагностика",
        "Детский приём и бережная коммуникация",
        "Ортодонтия, хирургия, имплантация и терапия",
        "Понятные условия, приятные цены и гибкий сервис",
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
        "Ключевые направления сформированы по данным сайта клиники и Яндекс Карт: терапия, детская стоматология, хирургия, имплантация, ортодонтия и эстетические процедуры.",
    },
  },
  {
    type: "doctors",
    title: "Врачи",
    order: 3,
    enabled: true,
    content: {
      description:
        "Команда клиники ведёт взрослых и детей, работает в нескольких направлениях и сочетает спокойный приём с вниманием к деталям.",
    },
  },
  {
    type: "gallery",
    title: "Клиника",
    order: 4,
    enabled: true,
    content: {
      description:
        "Реальные фотографии интерьера, кабинетов и фасада клиники, собранные со старого сайта и Яндекс Карт.",
    },
  },
  {
    type: "testimonials",
    title: "Что отмечают пациенты",
    order: 5,
    enabled: true,
    content: {
      rating: "4.7",
      reviewCount: "41",
      sourceLabel: "Яндекс Карты, март 2026",
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
        "Короткие ответы по записи, режиму работы, детскому приёму и основным направлениям лечения.",
    },
  },
  {
    type: "documents",
    title: "Документы",
    order: 7,
    enabled: true,
    content: {
      description:
        "Раздел для лицензий, политики обработки данных, оферты и другой обязательной информации.",
    },
  },
  {
    type: "contacts",
    title: "Контакты",
    order: 8,
    enabled: true,
    content: {
      description:
        "Для записи на приём и уточнения деталей свяжитесь с клиникой по телефону. Формы на сайте не используются.",
    },
  },
];

const services = [
  {
    title: "Терапия и лечение кариеса",
    slug: "terapiya-i-lechenie-kariesa",
    summary: "Диагностика, лечение кариеса, пломбирование и лечение каналов.",
    description:
      "Терапевтическое лечение, пломбирование, лечение кариеса и эндодонтия.",
    body: [
      "Направление объединяет базовую терапию, лечение кариеса, лечение каналов и восстановление зуба после поражения тканей.",
      "Подходит для пациентов, которым важно быстро снять боль, остановить разрушение зуба и сохранить функциональность без лишних этапов.",
      "Тактика лечения определяется после осмотра и диагностики по телефону можно согласовать удобное время визита.",
    ].join("\n\n"),
    priceFrom: "от 3 500 ₽",
    duration: "от 40 минут",
    icon: "spark",
    badge: "Базовое направление",
    seoTitle: "Терапия и лечение кариеса в Твери",
    seoDescription:
      "Лечение кариеса, пломбирование и эндодонтия в клинике Рамзи Дент в Твери.",
    photoPath: "/media/gallery/treatment-room.webp",
    order: 0,
    enabled: true,
  },
  {
    title: "Детская стоматология",
    slug: "detskaya-stomatologiya",
    summary:
      "Бережный детский приём, профилактика, лечение и спокойная адаптация ребёнка.",
    description:
      "Детский приём, профилактика, лечение молочных и постоянных зубов.",
    body: [
      "Клиника работает с детским кабинетом и делает акцент на спокойной коммуникации с ребёнком во время приёма.",
      "По отзывам пациентов особенно ценится аккуратный подход к детям и способность врача выстроить контакт даже при страхе перед лечением.",
      "По телефону можно обсудить возраст ребёнка, жалобы и удобное время визита без заполнения форм.",
    ].join("\n\n"),
    priceFrom: "от 2 800 ₽",
    duration: "от 30 минут",
    icon: "heart",
    badge: "Для детей",
    seoTitle: "Детская стоматология в Твери",
    seoDescription:
      "Детский стоматолог в Твери: бережный приём, профилактика и лечение в Рамзи Дент.",
    photoPath: "/media/gallery/interior.webp",
    order: 1,
    enabled: true,
  },
  {
    title: "Хирургия и удаление зубов",
    slug: "khirurgiya-i-udalenie-zubov",
    summary:
      "Удаление зубов, хирургические манипуляции и подготовка к имплантации.",
    description:
      "Хирургическая стоматология, удаление зубов и сопутствующие процедуры.",
    body: [
      "В это направление входят хирургические вмешательства, удаление зубов и подготовительные этапы перед последующим восстановлением.",
      "По данным Яндекс Карт хирургия входит в перечень ключевых услуг клиники.",
      "Перед визитом достаточно позвонить в клинику и согласовать удобное время и задачу.",
    ].join("\n\n"),
    priceFrom: "от 4 500 ₽",
    duration: "от 45 минут",
    icon: "shield",
    badge: "По показаниям",
    seoTitle: "Хирургическая стоматология в Твери",
    seoDescription:
      "Хирургическая стоматология и удаление зубов в клинике Рамзи Дент.",
    photoPath: "/media/gallery/treatment-room.webp",
    order: 2,
    enabled: true,
  },
  {
    title: "Имплантация и протезирование",
    slug: "implantatsiya-i-protezirovanie",
    summary:
      "Имплантология, коронки и ортопедическое восстановление функции зубного ряда.",
    description:
      "Имплантация, коронки, протезирование и восстановление утраченных зубов.",
    body: [
      "В клинике представлены имплантология, коронки и протезирование для пациентов, которым важно восстановить эстетику и жевательную функцию.",
      "Подход подбирается индивидуально после осмотра, оценки клинической ситуации и обсуждения нескольких сценариев лечения.",
      "Для первичной записи достаточно телефонного звонка — без форм и анкет на сайте.",
    ].join("\n\n"),
    priceFrom: "от 18 000 ₽",
    duration: "по плану лечения",
    icon: "crown",
    badge: "Восстановление зубов",
    seoTitle: "Имплантация и протезирование в Твери",
    seoDescription:
      "Имплантация, коронки и протезирование в стоматологии Рамзи Дент.",
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
      "Ортодонтия, брекеты и коррекция прикуса у взрослых и детей.",
    body: [
      "Ортодонтия входит в перечень услуг клиники по данным сайта и Яндекс Карт. Направление подходит взрослым и детям.",
      "На первичной консультации врач оценивает прикус, объясняет возможный план лечения и ориентиры по срокам.",
      "Для записи на консультацию достаточно звонка в клинику.",
    ].join("\n\n"),
    priceFrom: "от 12 000 ₽",
    duration: "по плану лечения",
    icon: "align",
    badge: "Исправление прикуса",
    seoTitle: "Ортодонтия и брекеты в Твери",
    seoDescription:
      "Ортодонтическое лечение и брекеты в клинике Рамзи Дент в Твери.",
    photoPath: "/media/gallery/facade-front.webp",
    order: 4,
    enabled: true,
  },
  {
    title: "Эстетическая стоматология и гигиена",
    slug: "esteticheskaya-stomatologiya-i-gigiena",
    summary:
      "Профгигиена, отбеливание, виниры и процедуры для естественной эстетики улыбки.",
    description:
      "Гигиена полости рта, отбеливание, виниры и эстетические решения.",
    body: [
      "В перечне услуг клиники представлены гигиена полости рта, отбеливание, виниры и люминиры.",
      "Это направление подходит, когда нужно улучшить внешний вид улыбки, поддержать профилактику и подготовить зубы к дальнейшему лечению.",
      "Точный план зависит от состояния эмали, десны и поставленной эстетической задачи.",
    ].join("\n\n"),
    priceFrom: "от 4 000 ₽",
    duration: "от 40 минут",
    icon: "smile",
    badge: "Профилактика и эстетика",
    seoTitle: "Эстетическая стоматология в Твери",
    seoDescription:
      "Профессиональная гигиена, отбеливание, виниры и эстетические процедуры в Рамзи Дент.",
    photoPath: "/media/gallery/reception.webp",
    order: 5,
    enabled: true,
  },
];

const doctors = [
  {
    name: "Немех Рамзи",
    slug: "nemeh-ramzi",
    speciality: "Стоматолог общей практики, детский ортодонт",
    experience: "33 года",
    bio: "Доктор с большим клиническим стажем. На старом сайте клиники указан как стоматолог общей практики и детский ортодонт.",
    education:
      "Практический опыт в лечении взрослых и детей. Подробные данные об образовании можно дополнить в админке.",
    schedule:
      "График уточняется по телефону. Для записи и консультации звоните в клинику.",
    photoPath: "/media/doctors/nemeh-ramzi.webp",
    order: 0,
    enabled: true,
  },
  {
    name: "Гаджикулиева Сирена",
    slug: "gadzhikulieva-sirena",
    speciality: "Детский стоматолог",
    experience: null,
    bio: "Врач, ориентированный на бережный детский приём и спокойную адаптацию ребёнка к лечению.",
    education:
      "Подробные данные о квалификации и сертификатах можно дополнить в админке.",
    schedule:
      "График уточняется по телефону. Для записи ребёнка заранее согласуйте удобное время.",
    photoPath: "/media/doctors/gadzhikulieva-sirena.webp",
    order: 1,
    enabled: true,
  },
  {
    name: "Эль-Амин Рами",
    slug: "el-amin-rami",
    speciality: "Стоматолог, хирург-имплантолог",
    experience: null,
    bio: "Врач направления хирургии и имплантации. На старом сайте клиники указан как хирург-имплантолог.",
    education:
      "Подробные данные о квалификации и курсах можно дополнить в админке.",
    schedule:
      "График уточняется по телефону. Для хирургических консультаций лучше звонить заранее.",
    photoPath: "/media/doctors/el-amin-rami.webp",
    order: 2,
    enabled: true,
  },
];

const testimonials = [
  {
    author: "Детский приём",
    role: "По мотивам отзывов в Яндекс Картах",
    quote:
      "Родители отмечают спокойный контакт с ребёнком и бережный приём даже в стрессовой ситуации.",
    rating: 5,
    source: "Яндекс Карты, март 2026",
    order: 0,
    enabled: true,
  },
  {
    author: "Лечение и консультация",
    role: "По мотивам отзывов в Яндекс Картах",
    quote:
      "Пациенты хвалят внимательные объяснения, ощущение заботы и аккуратное безболезненное лечение.",
    rating: 5,
    source: "Яндекс Карты, март 2026",
    order: 1,
    enabled: true,
  },
  {
    author: "Профгигиена и сервис",
    role: "По мотивам отзывов в Яндекс Картах",
    quote:
      "В отзывах часто отмечают современное оснащение, комфортную атмосферу и аккуратную работу врача.",
    rating: 5,
    source: "Яндекс Карты, март 2026",
    order: 2,
    enabled: true,
  },
];

const faqs = [
  {
    question: "Как записаться на приём?",
    answer:
      "Запись ведётся по телефону +7 903 808 01 40. Формы на сайте не используются — это сделано намеренно, чтобы заявка сразу попадала в клинику без промежуточных шагов.",
    order: 0,
    enabled: true,
  },
  {
    question: "Клиника принимает детей?",
    answer:
      "Да. По данным сайта и Яндекс Карт у клиники есть детский кабинет и отдельное направление детской стоматологии.",
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
      "По данным Яндекс Карт в клинике есть оплата картой, Wi‑Fi, гарантия и ряд сервисных удобств для пациентов.",
    order: 4,
    enabled: true,
  },
];

const documents = [
  {
    title: "Политика обработки персональных данных",
    slug: "privacy-policy",
    description:
      "Загрузите действующую политику, чтобы показать её на сайте и в разделе документов.",
    type: "policy",
    filePath: null,
    order: 0,
    enabled: false,
  },
  {
    title: "Публичная оферта",
    slug: "public-offer",
    description:
      "Разместите условия оказания услуг или договор-оферту для пациентов.",
    type: "offer",
    filePath: null,
    order: 1,
    enabled: false,
  },
  {
    title: "Лицензии и разрешительные документы",
    slug: "licenses",
    description:
      "Загрузите лицензии, свидетельства и другие обязательные документы клиники.",
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

async function upsertSettings() {
  const updates = Object.entries(siteSettings).map(([key, value]) =>
    prisma.siteSettings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    })
  );

  await prisma.$transaction(updates);
}

async function upsertMedia() {
  for (const item of mediaItems) {
    const meta = await getFileMeta(item.path);

    await prisma.media.upsert({
      where: { path: item.path },
      update: {
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
      create: {
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
    });
  }
}

async function upsertSections() {
  for (const section of sections) {
    await prisma.section.upsert({
      where: { type: section.type },
      update: {
        title: section.title,
        order: section.order,
        enabled: section.enabled,
        content: JSON.stringify(section.content),
      },
      create: {
        type: section.type,
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

  await prisma.adminUser.upsert({
    where: { email },
    update: { password: passwordHash },
    create: { email, password: passwordHash },
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
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
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
      create: {
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
    });
  }
}

async function upsertDoctors() {
  const mediaByPath = new Map(
    (await prisma.media.findMany()).map((item) => [item.path, item.id])
  );

  for (const doctor of doctors) {
    await prisma.doctor.upsert({
      where: { slug: doctor.slug },
      update: {
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
      create: {
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
    });
  }
}

async function replaceTestimonials() {
  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({ data: testimonials });
}

async function replaceFaqs() {
  await prisma.faqItem.deleteMany();
  await prisma.faqItem.createMany({ data: faqs });
}

async function upsertDocuments() {
  const mediaByPath = new Map(
    (await prisma.media.findMany()).map((item) => [item.path, item.id])
  );

  for (const document of documents) {
    await prisma.siteDocument.upsert({
      where: { slug: document.slug },
      update: {
        title: document.title,
        description: document.description,
        type: document.type,
        fileId: document.filePath ? mediaByPath.get(document.filePath) || null : null,
        order: document.order,
        enabled: document.enabled,
      },
      create: {
        title: document.title,
        slug: document.slug,
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
  await upsertAdminUser();
  await upsertSettings();
  await upsertMedia();
  await upsertSections();
  await upsertServices();
  await upsertDoctors();
  await replaceTestimonials();
  await replaceFaqs();
  await upsertDocuments();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

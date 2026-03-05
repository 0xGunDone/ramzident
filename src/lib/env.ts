const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
  nextAuthSecret: process.env.NEXTAUTH_SECRET || "",
  siteUrl: process.env.SITE_URL || "https://ramzident.ru",
  siteName: process.env.SITE_NAME || "Рамзи Дент",
  sitePhone: process.env.SITE_PHONE || "+7 903 808 01 40",
  sitePhoneRaw: process.env.SITE_PHONE_RAW || "+79038080140",
  siteEmail: process.env.SITE_EMAIL || "",
  siteAddress:
    process.env.SITE_ADDRESS || "170006, Россия, Тверь, улица Брагина, 7",
  siteCity: process.env.SITE_CITY || "Тверь",
  siteRegion: process.env.SITE_REGION || "Тверская область",
  sitePostalCode: process.env.SITE_POSTAL_CODE || "170006",
  workHoursWeekdays: process.env.WORK_HOURS_WEEKDAYS || "10:00 - 19:00",
  workHoursWeekend: process.env.WORK_HOURS_WEEKEND || "10:00 - 15:00",
  mapCenterLat: parseNumber(process.env.YANDEX_MAP_CENTER_LAT, 56.855939),
  mapCenterLng: parseNumber(process.env.YANDEX_MAP_CENTER_LNG, 35.894276),
  mapPinLat: parseNumber(process.env.YANDEX_MAP_PIN_LAT, 56.855958248139),
  mapPinLng: parseNumber(process.env.YANDEX_MAP_PIN_LNG, 35.894215563158),
  mapZoom: parseNumber(process.env.YANDEX_MAP_ZOOM, 17),
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterModel:
    process.env.OPENROUTER_MODEL || "qwen/qwen3-vl-30b-a3b-thinking",
};

export const siteConfig = {
  name: env.siteName,
  url: env.siteUrl,
  phone: env.sitePhone,
  phoneRaw: env.sitePhoneRaw,
  email: env.siteEmail,
  address: env.siteAddress,
  city: env.siteCity,
  region: env.siteRegion,
  postalCode: env.sitePostalCode,
  workHoursWeekdays: env.workHoursWeekdays,
  workHoursWeekend: env.workHoursWeekend,
  mapCenter: [env.mapCenterLng, env.mapCenterLat] as const,
  mapPin: [env.mapPinLng, env.mapPinLat] as const,
  mapZoom: env.mapZoom,
};

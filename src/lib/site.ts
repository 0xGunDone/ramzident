import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { env, siteConfig } from "@/lib/env";
import { getSettingsMap } from "@/lib/settings-store";

export type SiteSettingsMap = Record<string, string>;

const safeParseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getSiteSettings = cache(async () => {
  const dbSettings = (await getSettingsMap()) as SiteSettingsMap;

  return {
    clinicName: dbSettings.clinicName || siteConfig.name,
    phone: dbSettings.phone || siteConfig.phone,
    phoneRaw: dbSettings.phoneRaw || siteConfig.phoneRaw,
    email: dbSettings.email || siteConfig.email,
    address: dbSettings.address || siteConfig.address,
    city: dbSettings.city || siteConfig.city,
    region: dbSettings.region || siteConfig.region,
    postalCode: dbSettings.postalCode || siteConfig.postalCode,
    workHoursWeekdays:
      dbSettings.workHoursWeekdays || siteConfig.workHoursWeekdays,
    workHoursWeekend:
      dbSettings.workHoursWeekend || siteConfig.workHoursWeekend,
    mapCenterLat: Number(dbSettings.mapCenterLat || env.mapCenterLat),
    mapCenterLng: Number(dbSettings.mapCenterLng || env.mapCenterLng),
    mapPinLat: Number(dbSettings.mapPinLat || env.mapPinLat),
    mapPinLng: Number(dbSettings.mapPinLng || env.mapPinLng),
    mapZoom: Number(dbSettings.mapZoom || env.mapZoom),
    yandexMapsApiKey: dbSettings.yandexMapsApiKey || env.yandexMapsApiKey,
    yandexMetrikaId: dbSettings.yandexMetrikaId || env.yandexMetrikaId,
    googleAnalyticsId: dbSettings.googleAnalyticsId || env.googleAnalyticsId,
    // The canonical site URL must come from env for deploy consistency.
    siteUrl: env.siteUrl,
    copyrightText: dbSettings.copyrightText || "",
    creatorName: dbSettings.creatorName || "",
    creatorUrl: dbSettings.creatorUrl || "",
    openRouterApiKey: dbSettings.openRouterApiKey || env.openRouterApiKey,
    openRouterModel: dbSettings.openRouterModel || env.openRouterModel,
  };
});

export const getSections = cache(async () =>
  prisma.section.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  })
);

export const getSectionByType = cache(async (type: string) =>
  prisma.section.findUnique({
    where: { type },
  })
);

export const parseSectionContent = <T>(
  content: string | null | undefined,
  fallback: T
) => safeParseJson(content, fallback);

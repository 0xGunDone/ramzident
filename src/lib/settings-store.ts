import { prisma } from "@/lib/prisma";
import { decryptSettingValue, encryptSettingValue } from "@/lib/settings-crypto";

const SECRET_KEYS = new Set(["openRouterApiKey"]);

interface SiteSettingRow {
  key: string;
  value: string;
}

function isSecretKey(key: string) {
  return SECRET_KEYS.has(key);
}

function toStoredValue(key: string, value: string) {
  if (!isSecretKey(key)) {
    return value;
  }

  return encryptSettingValue(value);
}

function fromStoredValue(key: string, value: string) {
  if (!isSecretKey(key)) {
    return value;
  }

  return decryptSettingValue(value);
}

export async function getSettingValue(key: string) {
  const row = await prisma.siteSettings.findUnique({ where: { key } });
  if (!row) {
    return "";
  }

  return fromStoredValue(key, row.value);
}

export async function getSettingsMap() {
  const rows = (await prisma.siteSettings.findMany()) as SiteSettingRow[];
  const map: Record<string, string> = {};

  for (const row of rows) {
    map[row.key] = fromStoredValue(row.key, row.value);
  }

  return map;
}

export async function getAdminSettingsPayload() {
  const rows = (await prisma.siteSettings.findMany()) as SiteSettingRow[];
  const payload: Record<string, string | boolean> = {};

  for (const row of rows) {
    if (row.key === "openRouterApiKey") {
      const decrypted = fromStoredValue(row.key, row.value);
      payload.openRouterApiKeyConfigured = decrypted.trim().length > 0;
      continue;
    }

    payload[row.key] = fromStoredValue(row.key, row.value);
  }

  payload.openRouterApiKeyConfigured = payload.openRouterApiKeyConfigured ?? false;
  payload.openRouterApiKey = "";

  return payload;
}

export async function upsertSettings(entries: Array<[string, string]>) {
  if (entries.length === 0) {
    return;
  }

  await prisma.$transaction(
    entries.map(([key, value]) => {
      const storedValue = toStoredValue(key, String(value ?? ""));
      return prisma.siteSettings.upsert({
        where: { key },
        update: { value: storedValue },
        create: { key, value: storedValue },
      });
    })
  );
}

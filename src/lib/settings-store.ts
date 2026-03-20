import { prisma } from "@/lib/prisma";
import { decryptSettingValue, encryptSettingValue } from "@/lib/settings-crypto";

const SECRET_KEYS = new Set(["openRouterApiKey"]);

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
  const rows = await prisma.siteSettings.findMany();
  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = fromStoredValue(row.key, row.value);
    return acc;
  }, {});
}

export async function getAdminSettingsPayload() {
  const rows = await prisma.siteSettings.findMany();
  const payload = rows.reduce<Record<string, string | boolean>>((acc, row) => {
    if (row.key === "openRouterApiKey") {
      const decrypted = fromStoredValue(row.key, row.value);
      acc.openRouterApiKeyConfigured = decrypted.trim().length > 0;
      return acc;
    }

    acc[row.key] = fromStoredValue(row.key, row.value);
    return acc;
  }, {});

  payload.openRouterApiKeyConfigured = payload.openRouterApiKeyConfigured ?? false;
  payload.openRouterApiKey = "";

  return payload;
}

export async function upsertSettings(entries: Array<[string, string]>) {
  if (entries.length === 0) {
    return;
  }

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSettings.upsert({
        where: { key },
        update: { value: toStoredValue(key, String(value ?? "")) },
        create: { key, value: toStoredValue(key, String(value ?? "")) },
      })
    )
  );
}

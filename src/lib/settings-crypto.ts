import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_SIZE_BYTES = 12;
const PREFIX = "enc:v1";

let encryptionWarningShown = false;

function getEncryptionSecret() {
  return process.env.SETTINGS_ENCRYPTION_KEY?.trim() || "";
}

function getDecryptionSecrets() {
  const primary = process.env.SETTINGS_ENCRYPTION_KEY?.trim() || "";
  const legacy = process.env.NEXTAUTH_SECRET?.trim() || "";
  const secrets = [primary, legacy].filter((value) => value.length > 0);
  return Array.from(new Set(secrets));
}

function deriveKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function showEncryptionWarning() {
  if (encryptionWarningShown) return;
  encryptionWarningShown = true;
  console.warn(
    "[Settings] Missing SETTINGS_ENCRYPTION_KEY, storing sensitive settings without encryption."
  );
}

export function encryptSettingValue(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  const secret = getEncryptionSecret();
  if (!secret) {
    showEncryptionWarning();
    return normalized;
  }

  const iv = randomBytes(IV_SIZE_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(normalized, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSettingValue(value: string) {
  if (!value) {
    return "";
  }

  if (!value.startsWith(`${PREFIX}:`)) {
    return value;
  }

  const secrets = getDecryptionSecrets();
  if (secrets.length === 0) {
    return "";
  }

  const [, , ivBase64, tagBase64, encryptedBase64] = value.split(":");
  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    return "";
  }

  for (const secret of secrets) {
    try {
      const decipher = createDecipheriv(
        ALGORITHM,
        deriveKey(secret),
        Buffer.from(ivBase64, "base64")
      );
      decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedBase64, "base64")),
        decipher.final(),
      ]);
      return decrypted.toString("utf8");
    } catch {
      // Try next secret (legacy compatibility).
    }
  }

  return "";
}

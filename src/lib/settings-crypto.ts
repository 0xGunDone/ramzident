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

function getSettingsSecret() {
  return (
    process.env.SETTINGS_ENCRYPTION_KEY?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    ""
  );
}

function deriveKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function showEncryptionWarning() {
  if (encryptionWarningShown) return;
  encryptionWarningShown = true;
  console.warn(
    "[Settings] Missing SETTINGS_ENCRYPTION_KEY/NEXTAUTH_SECRET, storing sensitive settings without encryption."
  );
}

export function encryptSettingValue(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }

  const secret = getSettingsSecret();
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

  const secret = getSettingsSecret();
  if (!secret) {
    return "";
  }

  const [, , ivBase64, tagBase64, encryptedBase64] = value.split(":");
  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    return "";
  }

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
    return "";
  }
}

import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import sharp from "sharp";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);
const readonlyDatabasePattern = /attempt to write a readonly database|readonly/i;
const missingColumnPattern = /no such column|has no column named/i;
const unsupportedImagePattern = /unsupported image format|unsupported image/i;
const missingDatabasePattern = /unable to open database file/i;
const targetSizeNotReachedPattern = /IMAGE_TARGET_SIZE_NOT_REACHED/;
const TARGET_IMAGE_SIZE_BYTES = 200 * 1024;
const INITIAL_IMAGE_MAX_WIDTH = 1800;
const MIN_IMAGE_MAX_WIDTH = 320;
const INITIAL_WEBP_QUALITY = 84;
const MIN_WEBP_QUALITY = 20;
const WEBP_EFFORT = 6;

export interface StoredMediaFile {
  originalName: string;
  publicPath: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  mimeType: string;
  storedFilePath: string;
}

interface OptimizedImageResult {
  data: Buffer;
  width: number | null;
  height: number | null;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
}

function hasErrorCode(error: unknown, code: string): boolean {
  return isNodeError(error) && error.code === code;
}

export function getUploadErrorMessage(error: unknown) {
  if (isNodeError(error)) {
    if (error.code === "EACCES" || error.code === "EPERM" || error.code === "EROFS") {
      return "Нет прав на запись в public/uploads. Проверьте права каталога на сервере.";
    }

    if (error.code === "ENOSPC") {
      return "На сервере закончилось место на диске.";
    }
  }

  const message = error instanceof Error ? error.message : "Internal server error";

  if (readonlyDatabasePattern.test(message)) {
    return "База данных доступна только для чтения. Проверьте права на prisma/dev.db и каталог prisma/.";
  }

  if (missingColumnPattern.test(message)) {
    return "Схема базы данных на сервере устарела. Выполните `npx prisma migrate deploy` и перезапустите приложение.";
  }

  if (missingDatabasePattern.test(message)) {
    return "Не удалось открыть файл базы данных. Проверьте DATABASE_URL и права на каталог prisma/.";
  }

  if (unsupportedImagePattern.test(message)) {
    return "Формат изображения не поддерживается сервером. Сохраните файл как JPG, PNG или WebP и повторите загрузку.";
  }

  if (targetSizeNotReachedPattern.test(message)) {
    return "Не удалось сжать изображение до 200 КБ. Загрузите изображение меньшего разрешения.";
  }

  if (hasErrorCode(error, "P2002")) {
    return "Такой файл уже существует. Повторите загрузку ещё раз.";
  }

  return message;
}

async function encodeWebp(
  source: Buffer,
  maxWidth: number,
  quality: number
): Promise<OptimizedImageResult> {
  const { data, info } = await sharp(source)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality, effort: WEBP_EFFORT })
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width ?? null,
    height: info.height ?? null,
  };
}

async function optimizeImageToTarget(source: Buffer): Promise<OptimizedImageResult> {
  let maxWidth = INITIAL_IMAGE_MAX_WIDTH;
  let quality = INITIAL_WEBP_QUALITY;
  let best: OptimizedImageResult | null = null;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const candidate = await encodeWebp(source, maxWidth, quality);

    if (!best || candidate.data.byteLength < best.data.byteLength) {
      best = candidate;
    }

    if (candidate.data.byteLength <= TARGET_IMAGE_SIZE_BYTES) {
      return candidate;
    }

    if (quality > 40) {
      quality = Math.max(40, quality - 8);
      continue;
    }

    if (maxWidth > 1000) {
      maxWidth = Math.max(1000, Math.floor(maxWidth * 0.82));
      continue;
    }

    if (quality > MIN_WEBP_QUALITY) {
      quality = Math.max(MIN_WEBP_QUALITY, quality - 4);
      continue;
    }

    if (maxWidth > MIN_IMAGE_MAX_WIDTH) {
      maxWidth = Math.max(MIN_IMAGE_MAX_WIDTH, Math.floor(maxWidth * 0.85));
      continue;
    }

    break;
  }

  if (best && best.data.byteLength <= TARGET_IMAGE_SIZE_BYTES) {
    return best;
  }

  const fallback = await encodeWebp(source, MIN_IMAGE_MAX_WIDTH, MIN_WEBP_QUALITY);
  if (fallback.data.byteLength <= TARGET_IMAGE_SIZE_BYTES) {
    return fallback;
  }

  throw new Error("IMAGE_TARGET_SIZE_NOT_REACHED");
}

export async function storeUploadedFile(file: File): Promise<StoredMediaFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const originalName = file.name;
  const extension = path.extname(originalName).toLowerCase();
  const isImage = imageExtensions.has(extension);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await mkdir(uploadDir, { recursive: true });

  let filename = `${uniqueSuffix}${extension}`;
  let publicPath = `/uploads/${filename}`;
  let width: number | null = null;
  let height: number | null = null;
  let mimeType = file.type || "application/octet-stream";
  let storedFilePath = path.join(uploadDir, filename);
  let sizeBytes = buffer.byteLength;

  if (isImage && extension !== ".svg") {
    filename = `${uniqueSuffix}.webp`;
    publicPath = `/uploads/${filename}`;
    storedFilePath = path.join(uploadDir, filename);

    const optimized = await optimizeImageToTarget(buffer);
    await writeFile(storedFilePath, optimized.data);
    width = optimized.width;
    height = optimized.height;
    sizeBytes = optimized.data.byteLength;
    mimeType = "image/webp";
  } else {
    await writeFile(storedFilePath, buffer);

    if (isImage && extension === ".svg") {
      mimeType = "image/svg+xml";
    }
  }

  return {
    originalName,
    publicPath,
    width,
    height,
    sizeBytes,
    mimeType,
    storedFilePath,
  };
}

export async function cleanupStoredFile(storedFilePath: string | null | undefined) {
  if (!storedFilePath) {
    return;
  }

  await unlink(storedFilePath).catch(() => {});
}

export async function removePublicFile(publicPath: string | null | undefined) {
  if (!publicPath) {
    return;
  }

  const publicRoot = path.resolve(process.cwd(), "public");
  const relativePath = publicPath.replace(/^\/+/, "");
  const absolutePath = path.resolve(publicRoot, relativePath);

  if (
    absolutePath === publicRoot ||
    !absolutePath.startsWith(`${publicRoot}${path.sep}`)
  ) {
    return;
  }

  await unlink(absolutePath).catch(() => {});
}

import path from "path";
import { mkdir, unlink, writeFile } from "fs/promises";
import { Prisma } from "@prisma/client";
import sharp from "sharp";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);
const readonlyDatabasePattern = /attempt to write a readonly database|readonly/i;
const missingColumnPattern = /no such column|has no column named/i;
const unsupportedImagePattern = /unsupported image format|unsupported image/i;
const missingDatabasePattern = /unable to open database file/i;

export interface StoredMediaFile {
  originalName: string;
  publicPath: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  mimeType: string;
  storedFilePath: string;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error;
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

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "Такой файл уже существует. Повторите загрузку ещё раз.";
  }

  return message;
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

  if (isImage && extension !== ".svg") {
    filename = `${uniqueSuffix}.webp`;
    publicPath = `/uploads/${filename}`;
    storedFilePath = path.join(uploadDir, filename);

    const imageInfo = await sharp(buffer)
      .rotate()
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(storedFilePath);

    width = imageInfo.width ?? null;
    height = imageInfo.height ?? null;
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
    sizeBytes: buffer.byteLength,
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

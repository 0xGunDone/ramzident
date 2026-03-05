import path from "path";
import { mkdir, writeFile } from "fs/promises";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { MAX_UPLOAD_SIZE } from "@/types";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

export const GET = withAuth(async () => {
  const media = await prisma.media.findMany({
    orderBy: [{ usage: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(media);
});

export const POST = withAuth(async (request) => {
  const formData = await request.formData();
  const file = formData.get("file");
  const context = String(formData.get("context") || "");
  const usage = String(formData.get("usage") || "");
  const label = String(formData.get("label") || "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      { error: "Файл слишком большой. Максимум — 20 МБ." },
      { status: 413 }
    );
  }

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

  if (isImage && extension !== ".svg") {
    filename = `${uniqueSuffix}.webp`;
    publicPath = `/uploads/${filename}`;
    const filePath = path.join(uploadDir, filename);
    const imageInfo = await sharp(buffer)
      .rotate()
      .resize({ width: 1800, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(filePath);

    width = imageInfo.width ?? null;
    height = imageInfo.height ?? null;
    mimeType = "image/webp";
  } else {
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    if (isImage && extension === ".svg") {
      mimeType = "image/svg+xml";
    }
  }

  const media = await prisma.media.create({
    data: {
      filename: originalName,
      label: label || null,
      path: publicPath,
      width,
      height,
      sizeBytes: buffer.byteLength,
      mimeType,
      context: context || null,
      usage: usage || null,
    },
  });

  return NextResponse.json(media);
});

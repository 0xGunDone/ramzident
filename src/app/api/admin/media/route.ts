import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { MAX_UPLOAD_SIZE } from "@/types";
import {
  cleanupStoredFile,
  getUploadErrorMessage,
  storeUploadedFile,
} from "@/lib/media-storage";

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

  let storedFilePath: string | null = null;

  try {
    const storedFile = await storeUploadedFile(file);
    storedFilePath = storedFile.storedFilePath;

    const media = await prisma.media.create({
      data: {
        filename: storedFile.originalName,
        label: label || null,
        path: storedFile.publicPath,
        width: storedFile.width,
        height: storedFile.height,
        sizeBytes: storedFile.sizeBytes,
        mimeType: storedFile.mimeType,
        context: context || null,
        usage: usage || null,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    await cleanupStoredFile(storedFilePath);
    throw new Error(getUploadErrorMessage(error), { cause: error });
  }
});

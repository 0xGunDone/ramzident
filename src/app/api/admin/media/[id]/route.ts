import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import {
  cleanupStoredFile,
  getUploadErrorMessage,
  removePublicFile,
  storeUploadedFile,
} from "@/lib/media-storage";
import { MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_ERROR } from "@/types";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const media = await prisma.media.findUnique({ where: { id } });

    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: MAX_UPLOAD_SIZE_ERROR }, { status: 413 });
    }

    let storedFilePath: string | null = null;

    try {
      const storedFile = await storeUploadedFile(file);
      storedFilePath = storedFile.storedFilePath;

      const updated = await prisma.media.update({
        where: { id },
        data: {
          filename: storedFile.originalName,
          path: storedFile.publicPath,
          width: storedFile.width,
          height: storedFile.height,
          sizeBytes: storedFile.sizeBytes,
          mimeType: storedFile.mimeType,
        },
      });

      await removePublicFile(media.path);
      return NextResponse.json(updated);
    } catch (error) {
      await cleanupStoredFile(storedFilePath);
      throw new Error(getUploadErrorMessage(error), { cause: error });
    }
  }

  const body = await request.json();

  const updated = await prisma.media.update({
    where: { id },
    data: {
      ...(body.label !== undefined ? { label: body.label || null } : {}),
      ...(body.altText !== undefined ? { altText: body.altText || null } : {}),
      ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle || null } : {}),
      ...(body.seoDescription !== undefined ? { seoDescription: body.seoDescription || null } : {}),
      ...(body.context !== undefined ? { context: body.context || null } : {}),
      ...(body.usage !== undefined ? { usage: body.usage || null } : {}),
      ...(body.usedBy !== undefined ? { usedBy: body.usedBy || null } : {}),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_request, context) => {
  const { id } = await context.params;
  const media = await prisma.media.findUnique({ where: { id } });

  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.media.delete({ where: { id } });
  await removePublicFile(media.path);

  return NextResponse.json({ success: true });
});

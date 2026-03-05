import path from "path";
import { unlink } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
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

  const publicRoot = path.resolve(process.cwd(), "public");
  const relativePath = media.path.replace(/^\/+/, "");
  const absolutePath = path.resolve(publicRoot, relativePath);

  if (
    absolutePath === publicRoot ||
    !absolutePath.startsWith(`${publicRoot}${path.sep}`)
  ) {
    return NextResponse.json({ success: true });
  }

  await unlink(absolutePath).catch(() => {});

  return NextResponse.json({ success: true });
});

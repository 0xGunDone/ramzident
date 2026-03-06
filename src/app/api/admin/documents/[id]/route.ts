import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import {
  removeDocumentStaticOgAssets,
  syncDocumentStaticOgAssets,
} from "@/lib/og-static";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await request.json();
  const title = body.title ? String(body.title).trim() : undefined;
  const existing = await prisma.siteDocument.findUnique({
    where: { id },
    select: { slug: true },
  });

  const updated = await prisma.siteDocument.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(body.slug !== undefined ? { slug: slugify(body.slug || title || "document") } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(body.type !== undefined ? { type: body.type || "document" } : {}),
      ...(body.fileId !== undefined ? { fileId: body.fileId || null } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
    },
  });

  await syncDocumentStaticOgAssets(updated, existing?.slug).catch((error) => {
    console.error("[OG] Failed to sync document OG asset after update:", error);
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_request, context) => {
  const { id } = await context.params;
  const existing = await prisma.siteDocument.findUnique({
    where: { id },
    select: { slug: true },
  });

  await prisma.siteDocument.delete({ where: { id } });

  if (existing?.slug) {
    await removeDocumentStaticOgAssets(existing.slug).catch((error) => {
      console.error("[OG] Failed to remove document OG asset after delete:", error);
    });
  }

  return NextResponse.json({ success: true });
});

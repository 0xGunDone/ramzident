import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import {
  removeDocumentStaticOgAssets,
  syncDocumentStaticOgAssets,
} from "@/lib/og-static";
import { documentUpdateSchema, parseRequestJson } from "@/lib/validators";
import { enqueueOgJob } from "@/lib/og-jobs";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await parseRequestJson(request, documentUpdateSchema);
  const title = body.title;
  const existing = await prisma.siteDocument.findUnique({
    where: { id },
    select: { slug: true },
  });

  const updated = await prisma.siteDocument.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(body.slug !== undefined ? { slug: slugify(body.slug || title || "document") } : {}),
      ...(body.description !== undefined ? { description: body.description ?? null } : {}),
      ...(body.type !== undefined ? { type: body.type || "document" } : {}),
      ...(body.fileId !== undefined ? { fileId: body.fileId ?? null } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
    },
  });

  enqueueOgJob("document:update", async () => {
    await syncDocumentStaticOgAssets(updated, existing?.slug);
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
    enqueueOgJob("document:delete", async () => {
      await removeDocumentStaticOgAssets(existing.slug);
    });
  }

  return NextResponse.json({ success: true });
});

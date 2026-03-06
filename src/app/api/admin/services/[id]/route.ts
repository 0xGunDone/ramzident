import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import {
  removeServiceStaticOgAssets,
  syncServiceStaticOgAssets,
} from "@/lib/og-static";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await request.json();
  const title = body.title ? String(body.title).trim() : undefined;
  const existing = await prisma.service.findUnique({
    where: { id },
    select: { slug: true },
  });

  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(body.slug !== undefined ? { slug: slugify(body.slug || title || "service") } : {}),
      ...(body.summary !== undefined ? { summary: body.summary || null } : {}),
      ...(body.description !== undefined ? { description: body.description || "" } : {}),
      ...(body.body !== undefined ? { body: body.body || null } : {}),
      ...(body.priceFrom !== undefined ? { priceFrom: body.priceFrom || null } : {}),
      ...(body.duration !== undefined ? { duration: body.duration || null } : {}),
      ...(body.icon !== undefined ? { icon: body.icon || null } : {}),
      ...(body.badge !== undefined ? { badge: body.badge || null } : {}),
      ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle || null } : {}),
      ...(body.seoDescription !== undefined ? { seoDescription: body.seoDescription || null } : {}),
      ...(body.photoId !== undefined ? { photoId: body.photoId || null } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
    },
  });

  await syncServiceStaticOgAssets(updated, existing?.slug).catch((error) => {
    console.error("[OG] Failed to sync service OG asset after update:", error);
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_request, context) => {
  const { id } = await context.params;
  const existing = await prisma.service.findUnique({
    where: { id },
    select: { slug: true },
  });

  await prisma.service.delete({ where: { id } });

  if (existing?.slug) {
    await removeServiceStaticOgAssets(existing.slug).catch((error) => {
      console.error("[OG] Failed to remove service OG asset after delete:", error);
    });
  }

  return NextResponse.json({ success: true });
});

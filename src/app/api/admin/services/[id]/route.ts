import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import {
  removeServiceStaticOgAssets,
  syncServiceStaticOgAssets,
} from "@/lib/og-static";
import { parseRequestJson, serviceUpdateSchema } from "@/lib/validators";
import { enqueueOgJob } from "@/lib/og-jobs";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await parseRequestJson(request, serviceUpdateSchema);
  const title = body.title;
  const existing = await prisma.service.findUnique({
    where: { id },
    select: { slug: true },
  });

  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(body.slug !== undefined ? { slug: slugify(body.slug || title || "service") } : {}),
      ...(body.summary !== undefined ? { summary: body.summary ?? null } : {}),
      ...(body.description !== undefined ? { description: body.description || "" } : {}),
      ...(body.body !== undefined ? { body: body.body ?? null } : {}),
      ...(body.priceFrom !== undefined ? { priceFrom: body.priceFrom ?? null } : {}),
      ...(body.duration !== undefined ? { duration: body.duration ?? null } : {}),
      ...(body.icon !== undefined ? { icon: body.icon ?? null } : {}),
      ...(body.badge !== undefined ? { badge: body.badge ?? null } : {}),
      ...(body.seoTitle !== undefined ? { seoTitle: body.seoTitle ?? null } : {}),
      ...(body.seoDescription !== undefined ? { seoDescription: body.seoDescription ?? null } : {}),
      ...(body.photoId !== undefined ? { photoId: body.photoId ?? null } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
    },
  });

  enqueueOgJob("service:update", async () => {
    await syncServiceStaticOgAssets(updated, existing?.slug);
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
    enqueueOgJob("service:delete", async () => {
      await removeServiceStaticOgAssets(existing.slug);
    });
  }

  return NextResponse.json({ success: true });
});

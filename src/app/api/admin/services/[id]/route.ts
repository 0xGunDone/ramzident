import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await request.json();
  const title = body.title ? String(body.title).trim() : undefined;

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

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_request, context) => {
  const { id } = await context.params;

  await prisma.service.delete({ where: { id } });

  return NextResponse.json({ success: true });
});

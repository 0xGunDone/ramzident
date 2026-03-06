import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import { syncServiceStaticOgAssets } from "@/lib/og-static";

export const GET = withAuth(async () => {
  const services = await prisma.service.findMany({
    orderBy: { order: "asc" },
    include: { photo: true },
  });

  return NextResponse.json(services);
});

export const POST = withAuth(async (request) => {
  const body = await request.json();
  const title = String(body.title || "").trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const maxOrder = await prisma.service.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const service = await prisma.service.create({
    data: {
      title,
      slug: slugify(body.slug || title),
      summary: body.summary || null,
      description: body.description || title,
      body: body.body || null,
      priceFrom: body.priceFrom || null,
      duration: body.duration || null,
      icon: body.icon || null,
      badge: body.badge || null,
      seoTitle: body.seoTitle || null,
      seoDescription: body.seoDescription || null,
      photoId: body.photoId || null,
      order: maxOrder ? maxOrder.order + 1 : 0,
      enabled: body.enabled ?? true,
    },
  });

  await syncServiceStaticOgAssets(service).catch((error) => {
    console.error("[OG] Failed to generate service OG asset after create:", error);
  });

  return NextResponse.json(service);
});

export const PUT = withAuth(async (request) => {
  const body = await request.json();
  const services = body.services as { id: string; order: number }[] | undefined;

  if (!Array.isArray(services)) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  await prisma.$transaction(
    services.map((service) =>
      prisma.service.update({
        where: { id: service.id },
        data: { order: service.order },
      })
    )
  );

  return NextResponse.json({ success: true });
});

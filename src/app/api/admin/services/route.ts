import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import { syncServiceStaticOgAssets } from "@/lib/og-static";
import { parseRequestJson, serviceCreateSchema, serviceReorderSchema } from "@/lib/validators";
import { enqueueOgJob } from "@/lib/og-jobs";

export const GET = withAuth(async () => {
  const services = await prisma.service.findMany({
    orderBy: { order: "asc" },
    include: { photo: true },
  });

  return NextResponse.json(services);
});

export const POST = withAuth(async (request) => {
  const body = await parseRequestJson(request, serviceCreateSchema);
  const title = body.title;

  const maxOrder = await prisma.service.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const service = await prisma.service.create({
    data: {
      title,
      slug: slugify(body.slug || title),
      summary: body.summary ?? null,
      description: body.description || title,
      body: body.body ?? null,
      priceFrom: body.priceFrom ?? null,
      duration: body.duration ?? null,
      icon: body.icon ?? null,
      badge: body.badge ?? null,
      seoTitle: body.seoTitle ?? null,
      seoDescription: body.seoDescription ?? null,
      photoId: body.photoId ?? null,
      order: maxOrder ? maxOrder.order + 1 : 0,
      enabled: body.enabled ?? true,
    },
  });

  enqueueOgJob("service:create", async () => {
    await syncServiceStaticOgAssets(service);
  });

  return NextResponse.json(service);
});

export const PUT = withAuth(async (request) => {
  const body = await parseRequestJson(request, serviceReorderSchema);
  const { services } = body;

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

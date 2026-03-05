import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export const GET = withAuth(async () => {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(testimonials);
});

export const POST = withAuth(async (request) => {
  const body = await request.json();
  const maxOrder = await prisma.testimonial.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const testimonial = await prisma.testimonial.create({
    data: {
      author: body.author || "Пациент клиники",
      role: body.role || null,
      quote: body.quote || "",
      rating: Number(body.rating || 5),
      source: body.source || null,
      order: maxOrder ? maxOrder.order + 1 : 0,
      enabled: body.enabled ?? true,
    },
  });

  return NextResponse.json(testimonial);
});

export const PUT = withAuth(async (request) => {
  const body = await request.json();
  const testimonials = body.testimonials as { id: string; order: number }[] | undefined;

  if (!Array.isArray(testimonials)) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  await prisma.$transaction(
    testimonials.map((testimonial) =>
      prisma.testimonial.update({
        where: { id: testimonial.id },
        data: { order: testimonial.order },
      })
    )
  );

  return NextResponse.json({ success: true });
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { parseRequestJson, testimonialUpdateSchema } from "@/lib/validators";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await parseRequestJson(request, testimonialUpdateSchema);

  const updated = await prisma.testimonial.update({
    where: { id },
    data: {
      ...(body.author !== undefined ? { author: body.author || "Пациент" } : {}),
      ...(body.role !== undefined ? { role: body.role ?? null } : {}),
      ...(body.quote !== undefined ? { quote: body.quote } : {}),
      ...(body.rating !== undefined ? { rating: Number(body.rating || 5) } : {}),
      ...(body.source !== undefined ? { source: body.source ?? null } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_request, context) => {
  const { id } = await context.params;

  await prisma.testimonial.delete({ where: { id } });

  return NextResponse.json({ success: true });
});

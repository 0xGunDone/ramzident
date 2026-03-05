import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const updated = await prisma.faqItem.update({
    where: { id },
    data: {
      ...(body.question !== undefined ? { question: body.question || "" } : {}),
      ...(body.answer !== undefined ? { answer: body.answer || "" } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_request, context) => {
  const { id } = await context.params;

  await prisma.faqItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { faqUpdateSchema, parseRequestJson } from "@/lib/validators";
import { revalidatePublicSite } from "@/lib/public-cache";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await parseRequestJson(request, faqUpdateSchema);

  const updated = await prisma.faqItem.update({
    where: { id },
    data: {
      ...(body.question !== undefined ? { question: body.question } : {}),
      ...(body.answer !== undefined ? { answer: body.answer } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
    },
  });

  revalidatePublicSite();
  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_request, context) => {
  const { id } = await context.params;

  await prisma.faqItem.delete({ where: { id } });

  revalidatePublicSite();
  return NextResponse.json({ success: true });
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { faqCreateSchema, faqReorderSchema, parseRequestJson } from "@/lib/validators";
import { revalidatePublicSite } from "@/lib/public-cache";

export const GET = withAuth(async () => {
  const items = await prisma.faqItem.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(items);
});

export const POST = withAuth(async (request) => {
  const body = await parseRequestJson(request, faqCreateSchema);
  const maxOrder = await prisma.faqItem.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const item = await prisma.faqItem.create({
    data: {
      question: body.question || "",
      answer: body.answer || "",
      order: maxOrder ? maxOrder.order + 1 : 0,
      enabled: body.enabled ?? true,
    },
  });

  revalidatePublicSite();
  return NextResponse.json(item);
});

export const PUT = withAuth(async (request) => {
  const body = await parseRequestJson(request, faqReorderSchema);
  const { items } = body;

  await prisma.$transaction(
    items.map((item: { id: string; order: number }) =>
      prisma.faqItem.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  revalidatePublicSite();
  return NextResponse.json({ success: true });
});

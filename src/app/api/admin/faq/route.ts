import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export const GET = withAuth(async () => {
  const items = await prisma.faqItem.findMany({
    orderBy: { order: "asc" },
  });

  return NextResponse.json(items);
});

export const POST = withAuth(async (request) => {
  const body = await request.json();
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

  return NextResponse.json(item);
});

export const PUT = withAuth(async (request) => {
  const body = await request.json();
  const items = body.items as { id: string; order: number }[] | undefined;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  await prisma.$transaction(
    items.map((item) =>
      prisma.faqItem.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    )
  );

  return NextResponse.json({ success: true });
});

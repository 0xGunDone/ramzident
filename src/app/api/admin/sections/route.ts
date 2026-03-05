import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

const defaultSections = [
  { type: "hero", title: "Главный экран", order: 0 },
  { type: "about", title: "О клинике", order: 1 },
  { type: "services", title: "Услуги", order: 2 },
  { type: "doctors", title: "Врачи", order: 3 },
  { type: "gallery", title: "Клиника", order: 4 },
  { type: "testimonials", title: "Отзывы", order: 5 },
  { type: "faq", title: "FAQ", order: 6 },
  { type: "documents", title: "Документы", order: 7 },
  { type: "contacts", title: "Контакты", order: 8 },
];

export const GET = withAuth(async () => {
  const sections = await prisma.section.findMany({
    orderBy: { order: "asc" },
  });

  if (sections.length === 0) {
    await prisma.section.createMany({ data: defaultSections });
    const created = await prisma.section.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json(created);
  }

  return NextResponse.json(sections);
});

export const PUT = withAuth(async (request) => {
  const body = await request.json();
  const sections = body.sections as
    | { id: string; order: number; enabled?: boolean }[]
    | undefined;

  if (!Array.isArray(sections)) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  await prisma.$transaction(
    sections.map((section) =>
      prisma.section.update({
        where: { id: section.id },
        data: {
          order: section.order,
          ...(section.enabled !== undefined
            ? { enabled: Boolean(section.enabled) }
            : {}),
        },
      })
    )
  );

  return NextResponse.json({ success: true });
});

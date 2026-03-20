import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { parseRequestJson, sectionReorderSchema } from "@/lib/validators";
import { revalidatePublicSite } from "@/lib/public-cache";

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
  const body = await parseRequestJson(request, sectionReorderSchema);
  const { sections } = body;

  await prisma.$transaction(
    sections.map((section: { id: string; order: number; enabled?: boolean }) =>
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

  revalidatePublicSite();
  return NextResponse.json({ success: true });
});

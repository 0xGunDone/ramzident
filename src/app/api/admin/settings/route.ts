import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";

export const GET = withAuth(async () => {
  const settings = await prisma.siteSettings.findMany();
  const settingsObject = settings.reduce<Record<string, string>>((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return NextResponse.json(settingsObject);
});

export const PUT = withAuth(async (request) => {
  const body = (await request.json()) as Record<string, string>;

  await prisma.$transaction(
    Object.entries(body).map(([key, value]) =>
      prisma.siteSettings.upsert({
        where: { key },
        update: { value: String(value ?? "") },
        create: { key, value: String(value ?? "") },
      })
    )
  );

  return NextResponse.json({ success: true });
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { parseRequestJson, sectionUpdateSchema } from "@/lib/validators";
import { revalidatePublicSite } from "@/lib/public-cache";

export const GET = withAuth(async (_request, context) => {
  const { id } = await context.params;
  const section = await prisma.section.findUnique({
    where: { id },
  });

  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(section);
});

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await parseRequestJson(request, sectionUpdateSchema);

  const updated = await prisma.section.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title ?? null } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.content !== undefined ? { content: body.content ?? null } : {}),
    },
  });

  revalidatePublicSite();
  return NextResponse.json(updated);
});

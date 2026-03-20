import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import { doctorUpdateSchema, parseRequestJson } from "@/lib/validators";

export const PUT = withAuth(async (request, context) => {
  const { id } = await context.params;
  const body = await parseRequestJson(request, doctorUpdateSchema);
  const name = body.name;

  const updated = await prisma.doctor.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(body.slug !== undefined ? { slug: slugify(body.slug || name || "doctor") } : {}),
      ...(body.speciality !== undefined ? { speciality: body.speciality || "" } : {}),
      ...(body.experience !== undefined ? { experience: body.experience ?? null } : {}),
      ...(body.bio !== undefined ? { bio: body.bio ?? null } : {}),
      ...(body.education !== undefined ? { education: body.education ?? null } : {}),
      ...(body.schedule !== undefined ? { schedule: body.schedule ?? null } : {}),
      ...(body.photoId !== undefined ? { photoId: body.photoId ?? null } : {}),
      ...(body.enabled !== undefined ? { enabled: Boolean(body.enabled) } : {}),
      ...(body.order !== undefined ? { order: Number(body.order) } : {}),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withAuth(async (_request, context) => {
  const { id } = await context.params;

  await prisma.doctor.delete({ where: { id } });

  return NextResponse.json({ success: true });
});

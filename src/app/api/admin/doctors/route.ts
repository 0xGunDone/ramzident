import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import { doctorCreateSchema, doctorReorderSchema, parseRequestJson } from "@/lib/validators";

export const GET = withAuth(async () => {
  const doctors = await prisma.doctor.findMany({
    orderBy: { order: "asc" },
    include: { photo: true },
  });

  return NextResponse.json(doctors);
});

export const POST = withAuth(async (request) => {
  const body = await parseRequestJson(request, doctorCreateSchema);
  const name = body.name;

  const maxOrder = await prisma.doctor.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const doctor = await prisma.doctor.create({
    data: {
      name,
      slug: slugify(body.slug || name),
      speciality: body.speciality || "",
      experience: body.experience ?? null,
      bio: body.bio ?? null,
      education: body.education ?? null,
      schedule: body.schedule ?? null,
      photoId: body.photoId ?? null,
      order: maxOrder ? maxOrder.order + 1 : 0,
      enabled: body.enabled ?? true,
    },
  });

  return NextResponse.json(doctor);
});

export const PUT = withAuth(async (request) => {
  const body = await parseRequestJson(request, doctorReorderSchema);
  const { doctors } = body;

  await prisma.$transaction(
    doctors.map((doctor: { id: string; order: number }) =>
      prisma.doctor.update({
        where: { id: doctor.id },
        data: { order: doctor.order },
      })
    )
  );

  return NextResponse.json({ success: true });
});

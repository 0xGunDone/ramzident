import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";

export const GET = withAuth(async () => {
  const doctors = await prisma.doctor.findMany({
    orderBy: { order: "asc" },
    include: { photo: true },
  });

  return NextResponse.json(doctors);
});

export const POST = withAuth(async (request) => {
  const body = await request.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const maxOrder = await prisma.doctor.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const doctor = await prisma.doctor.create({
    data: {
      name,
      slug: slugify(body.slug || name),
      speciality: body.speciality || "",
      experience: body.experience || null,
      bio: body.bio || null,
      education: body.education || null,
      schedule: body.schedule || null,
      photoId: body.photoId || null,
      order: maxOrder ? maxOrder.order + 1 : 0,
      enabled: body.enabled ?? true,
    },
  });

  return NextResponse.json(doctor);
});

export const PUT = withAuth(async (request) => {
  const body = await request.json();
  const doctors = body.doctors as { id: string; order: number }[] | undefined;

  if (!Array.isArray(doctors)) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  await prisma.$transaction(
    doctors.map((doctor) =>
      prisma.doctor.update({
        where: { id: doctor.id },
        data: { order: doctor.order },
      })
    )
  );

  return NextResponse.json({ success: true });
});

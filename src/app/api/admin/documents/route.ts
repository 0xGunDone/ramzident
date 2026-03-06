import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import { syncDocumentStaticOgAssets } from "@/lib/og-static";

export const GET = withAuth(async () => {
  const documents = await prisma.siteDocument.findMany({
    orderBy: { order: "asc" },
    include: { file: true },
  });

  return NextResponse.json(documents);
});

export const POST = withAuth(async (request) => {
  const body = await request.json();
  const title = String(body.title || "").trim();

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const maxOrder = await prisma.siteDocument.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const document = await prisma.siteDocument.create({
    data: {
      title,
      slug: slugify(body.slug || title),
      description: body.description || null,
      type: body.type || "document",
      fileId: body.fileId || null,
      order: maxOrder ? maxOrder.order + 1 : 0,
      enabled: body.enabled ?? false,
    },
  });

  await syncDocumentStaticOgAssets(document).catch((error) => {
    console.error("[OG] Failed to generate document OG asset after create:", error);
  });

  return NextResponse.json(document);
});

export const PUT = withAuth(async (request) => {
  const body = await request.json();
  const documents = body.documents as { id: string; order: number }[] | undefined;

  if (!Array.isArray(documents)) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  await prisma.$transaction(
    documents.map((document) =>
      prisma.siteDocument.update({
        where: { id: document.id },
        data: { order: document.order },
      })
    )
  );

  return NextResponse.json({ success: true });
});

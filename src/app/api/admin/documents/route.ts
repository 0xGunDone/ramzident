import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { withAuth } from "@/lib/api";
import { syncDocumentStaticOgAssets } from "@/lib/og-static";
import {
  documentCreateSchema,
  documentReorderSchema,
  parseRequestJson,
} from "@/lib/validators";
import { enqueueOgJob } from "@/lib/og-jobs";

export const GET = withAuth(async () => {
  const documents = await prisma.siteDocument.findMany({
    orderBy: { order: "asc" },
    include: { file: true },
  });

  return NextResponse.json(documents);
});

export const POST = withAuth(async (request) => {
  const body = await parseRequestJson(request, documentCreateSchema);
  const title = body.title;

  const maxOrder = await prisma.siteDocument.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const document = await prisma.siteDocument.create({
    data: {
      title,
      slug: slugify(body.slug || title),
      description: body.description ?? null,
      type: body.type || "document",
      fileId: body.fileId ?? null,
      order: maxOrder ? maxOrder.order + 1 : 0,
      enabled: body.enabled ?? false,
    },
  });

  enqueueOgJob("document:create", async () => {
    await syncDocumentStaticOgAssets(document);
  });

  return NextResponse.json(document);
});

export const PUT = withAuth(async (request) => {
  const body = await parseRequestJson(request, documentReorderSchema);
  const { documents } = body;

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

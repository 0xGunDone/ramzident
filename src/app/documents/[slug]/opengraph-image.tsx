import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDocumentStaticOgPath, STATIC_OG_PATHS } from "@/lib/og-paths";
import { createOgImageResponse } from "@/lib/og-route";
import { ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/jpeg";
export const alt = "Документ Рамзи Дент";

interface DocumentOgImageProps {
  params: Promise<{ slug: string }>;
}

export default async function OpenGraphImage({ params }: DocumentOgImageProps) {
  const { slug } = await params;
  const document = await prisma.siteDocument.findUnique({
    where: { slug },
    select: {
      enabled: true,
      fileId: true,
      title: true,
      type: true,
      description: true,
    },
  });

  if (!document || !document.enabled || !document.fileId) {
    notFound();
  }

  return createOgImageResponse(
    getDocumentStaticOgPath(slug),
    STATIC_OG_PATHS.documentsIndex
  );
}

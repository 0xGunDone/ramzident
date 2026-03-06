import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
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

  return createOgImage({
    eyebrow: document.type,
    title: document.title,
    accent: "Рамзи Дент",
    description:
      document.description ||
      "Публичная страница документа стоматологической клиники в Твери.",
    tags: ["Документы", "Тверь"],
  });
}

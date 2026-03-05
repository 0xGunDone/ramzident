import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/data";
import { getSiteSettings } from "@/lib/site";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Страница услуги Рамзи Дент";

interface ServiceOgImageProps {
  params: Promise<{ slug: string }>;
}

export default async function OpenGraphImage({ params }: ServiceOgImageProps) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([
    getServiceBySlug(slug),
    getSiteSettings(),
  ]);

  if (!service || !service.enabled) {
    notFound();
  }

  return createOgImage({
    eyebrow: "Услуга",
    title: service.seoTitle || service.title,
    accent: settings.clinicName,
    description: service.seoDescription || service.summary || service.description,
    tags: [service.priceFrom || "", service.duration || "", settings.city],
  });
}

import { notFound } from "next/navigation";
import { getServiceBySlug } from "@/lib/data";
import { getServiceStaticOgPath, STATIC_OG_PATHS } from "@/lib/og-paths";
import { createOgImageResponse } from "@/lib/og-route";
import { ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/jpeg";
export const alt = "Услуга Рамзи Дент";

interface ServiceTwitterImageProps {
  params: Promise<{ slug: string }>;
}

export default async function TwitterImage({
  params,
}: ServiceTwitterImageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service || !service.enabled) {
    notFound();
  }

  return createOgImageResponse(
    getServiceStaticOgPath(service.slug),
    STATIC_OG_PATHS.servicesIndex
  );
}

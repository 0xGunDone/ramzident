import { getSiteSettings } from "@/lib/site";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Услуги Рамзи Дент";

export default async function TwitterImage() {
  const settings = await getSiteSettings();

  return createOgImage({
    eyebrow: "Услуги",
    title: "Стоматологические услуги",
    accent: settings.clinicName,
    description:
      "От терапии и детской стоматологии до имплантации, хирургии и ортодонтии.",
    tags: [settings.city, settings.phone],
  });
}

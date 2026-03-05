import { getSiteSettings } from "@/lib/site";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Рамзи Дент";

export default async function TwitterImage() {
  const settings = await getSiteSettings();

  return createOgImage({
    eyebrow: "Рамзи Дент",
    title: settings.clinicName,
    accent: "стоматология в Твери",
    description:
      "Лечение, детская стоматология, хирургия, имплантация, ортодонтия и эстетические процедуры.",
    tags: [settings.city, settings.phone],
  });
}

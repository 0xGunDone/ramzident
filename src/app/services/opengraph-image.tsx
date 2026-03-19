import { getSiteSettings } from "@/lib/site";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Услуги Рамзи Дент";

export default async function OpenGraphImage() {
  const settings = await getSiteSettings();

  return createOgImage({
    eyebrow: "Услуги",
    title: "Стоматологические услуги",
    accent: settings.clinicName,
    description:
      "Терапия, хирургия, имплантация, ортодонтия, детская стоматология и эстетические процедуры.",
    tags: [settings.city, "Стоматология", settings.phone],
  });
}

import { getSiteSettings } from "@/lib/site";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Рамзи Дент";

export default async function OpenGraphImage() {
  const settings = await getSiteSettings();

  return createOgImage({
    eyebrow: "Стоматология в Твери",
    title: settings.clinicName,
    accent: "для взрослых и детей",
    description:
      "Терапия, детская стоматология, ортодонтия, хирургия, имплантация и эстетические процедуры.",
    tags: [settings.city, settings.workHoursWeekdays, settings.phone],
  });
}

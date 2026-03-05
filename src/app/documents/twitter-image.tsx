import { getSiteSettings } from "@/lib/site";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Документы Рамзи Дент";

export default async function TwitterImage() {
  const settings = await getSiteSettings();

  return createOgImage({
    eyebrow: "Документы",
    title: "Лицензии и документы",
    accent: settings.clinicName,
    description:
      "Публичный раздел с лицензиями, политиками и обязательной информацией клиники.",
    tags: [settings.city, settings.phone],
  });
}

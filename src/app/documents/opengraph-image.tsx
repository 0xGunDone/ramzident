import { getSiteSettings } from "@/lib/site";
import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Документы Рамзи Дент";

export default async function OpenGraphImage() {
  const settings = await getSiteSettings();

  return createOgImage({
    eyebrow: "Документы",
    title: "Лицензии и обязательная информация",
    accent: settings.clinicName,
    description:
      "Публичный раздел с юридически значимыми документами, лицензиями и политиками клиники.",
    tags: ["Документы", settings.city, settings.phone],
  });
}

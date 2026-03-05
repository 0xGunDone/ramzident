import { createOgImage, ogContentType, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "404 Рамзи Дент";

export default function TwitterImage() {
  return createOgImage({
    eyebrow: "404",
    title: "Страница не найдена",
    accent: "Рамзи Дент",
    description:
      "Материал был удалён, перенесён или ещё не опубликован. Вернитесь на главную страницу сайта.",
    tags: ["ramzident.ru", "Тверь"],
  });
}

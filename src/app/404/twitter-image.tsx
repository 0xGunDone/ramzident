import { STATIC_OG_PATHS } from "@/lib/og-paths";
import { createOgImageResponse } from "@/lib/og-route";
import { ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/jpeg";
export const alt = "404 Рамзи Дент";

export default function TwitterImage() {
  return createOgImageResponse(STATIC_OG_PATHS.notFound, STATIC_OG_PATHS.notFound);
}

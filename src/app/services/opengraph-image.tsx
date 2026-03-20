import { STATIC_OG_PATHS } from "@/lib/og-paths";
import { createOgImageResponse } from "@/lib/og-route";
import { ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/jpeg";
export const alt = "Услуги Рамзи Дент";

export default async function OpenGraphImage() {
  return createOgImageResponse(
    STATIC_OG_PATHS.servicesIndex,
    STATIC_OG_PATHS.servicesIndex
  );
}

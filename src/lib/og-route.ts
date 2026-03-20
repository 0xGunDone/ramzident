import path from "node:path";
import { readFile } from "node:fs/promises";

const JPEG_CONTENT_TYPE = "image/jpeg";
const OG_CACHE_CONTROL = "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

function resolvePublicPath(publicPath: string) {
  return path.join(process.cwd(), "public", publicPath.replace(/^\/+/, ""));
}

async function readPublicImage(publicPath: string) {
  return readFile(resolvePublicPath(publicPath));
}

export async function createOgImageResponse(
  preferredPath: string,
  fallbackPath: string
): Promise<Response> {
  const image =
    (await readPublicImage(preferredPath).catch(() => null)) ??
    (await readPublicImage(fallbackPath).catch(() => null));

  if (!image) {
    return new Response("OG image not found", { status: 404 });
  }

  return new Response(image, {
    headers: {
      "Content-Type": JPEG_CONTENT_TYPE,
      "Cache-Control": OG_CACHE_CONTROL,
    },
  });
}

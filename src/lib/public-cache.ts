import { revalidatePath } from "next/cache";

const STATIC_PUBLIC_PATHS = ["/", "/services", "/documents", "/sitemap.xml"];

export function revalidatePublicSite() {
  for (const path of STATIC_PUBLIC_PATHS) {
    revalidatePath(path);
  }

  revalidatePath("/services/[slug]", "page");
  revalidatePath("/documents/[slug]", "page");
}

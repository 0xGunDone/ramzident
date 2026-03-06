import { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/admin/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

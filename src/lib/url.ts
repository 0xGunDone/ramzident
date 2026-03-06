import { env } from "@/lib/env";

const normalizedSiteUrl = env.siteUrl.replace(/\/+$/, "");

export function getSiteUrl() {
  return normalizedSiteUrl;
}

export function absoluteUrl(path = "") {
  if (!path) return normalizedSiteUrl;
  if (/^https?:\/\//i.test(path)) return path;

  return `${normalizedSiteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

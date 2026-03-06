import type { Metadata } from "next";
import { ogSize } from "@/lib/og";
import { absoluteUrl } from "@/lib/url";

interface SocialMetadataOptions {
  title?: string;
  description?: string;
  imageAlt: string;
  ogPath: string;
  twitterPath?: string;
  canonicalPath?: string;
  openGraphUrl?: string;
  noindex?: boolean;
}

export function createSocialMetadata({
  title,
  description,
  imageAlt,
  ogPath,
  twitterPath,
  canonicalPath,
  openGraphUrl,
  noindex,
}: SocialMetadataOptions): Metadata {
  const canonicalUrl = canonicalPath ? absoluteUrl(canonicalPath) : undefined;
  const resolvedOgPath = absoluteUrl(ogPath);
  const resolvedTwitterPath = absoluteUrl(twitterPath || ogPath);
  const resolvedOpenGraphUrl = openGraphUrl
    ? absoluteUrl(openGraphUrl)
    : canonicalUrl;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(canonicalUrl
      ? {
          alternates: {
            canonical: canonicalUrl,
          },
        }
      : {}),
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(resolvedOpenGraphUrl ? { url: resolvedOpenGraphUrl } : {}),
      images: [
        {
          url: resolvedOgPath,
          secureUrl: resolvedOgPath,
          width: ogSize.width,
          height: ogSize.height,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      images: [resolvedTwitterPath],
    },
    ...(noindex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

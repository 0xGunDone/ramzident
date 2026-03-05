import type { Metadata } from "next";
import { ogSize } from "@/lib/og";

interface SocialMetadataOptions {
  title?: string;
  description?: string;
  imageAlt: string;
  ogPath: string;
  twitterPath?: string;
  openGraphUrl?: string;
}

export function createSocialMetadata({
  title,
  description,
  imageAlt,
  ogPath,
  twitterPath,
  openGraphUrl,
}: SocialMetadataOptions): Metadata {
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(openGraphUrl ? { url: openGraphUrl } : {}),
      images: [
        {
          url: ogPath,
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
      images: [twitterPath || ogPath],
    },
  };
}

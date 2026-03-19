import type { Metadata } from "next";
import { env } from "@/lib/env";
import { getHomeStaticOgPath } from "@/lib/og-static";
import { getSiteSettings } from "@/lib/site";
import { createSocialMetadata } from "@/lib/metadata";
import { getSiteUrl } from "@/lib/url";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const ogPath = await getHomeStaticOgPath();
  const clinicName = settings.clinicName;
  const title = `${clinicName} — стоматология для взрослых и детей в Твери`;
  const description =
    "Стоматологическая клиника Рамзи Дент в Твери: терапия, детская стоматология, хирургия, имплантация, ортодонтия и эстетическая стоматология. Запись по телефону.";
  const social = createSocialMetadata({
    title,
    description,
    imageAlt: clinicName,
    ogPath,
    canonicalPath: "/",
    openGraphUrl: "/",
  });

  return {
    metadataBase: new URL(getSiteUrl() || env.siteUrl),
    title: {
      default: title,
      template: `%s | ${clinicName}`,
    },
    description,
    applicationName: clinicName,
    keywords: [
      "стоматология Тверь",
      "стоматологическая клиника Тверь",
      "детская стоматология Тверь",
      "имплантация зубов Тверь",
      "ортодонтия Тверь",
      "лечение кариеса Тверь",
    ],
    category: "healthcare",
    ...social,
    openGraph: {
      ...social.openGraph,
      type: "website",
      locale: "ru_RU",
      siteName: clinicName,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

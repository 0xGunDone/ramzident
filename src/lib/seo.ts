import type { Metadata } from "next";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/lib/site";
import { createSocialMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const clinicName = settings.clinicName;
  const title = `${clinicName} — стоматология для взрослых и детей в Твери`;
  const description =
    "Рамзи Дент в Твери: терапия, детская стоматология, ортодонтия, хирургия, имплантация и эстетические процедуры. Запись по телефону.";
  const social = createSocialMetadata({
    title,
    description,
    imageAlt: clinicName,
    ogPath: `${settings.siteUrl}/opengraph-image`,
    twitterPath: `${settings.siteUrl}/twitter-image`,
    openGraphUrl: settings.siteUrl,
  });

  return {
    metadataBase: new URL(settings.siteUrl || env.siteUrl),
    title: {
      default: title,
      template: `%s | ${clinicName}`,
    },
    description,
    applicationName: clinicName,
    alternates: {
      canonical: "/",
    },
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

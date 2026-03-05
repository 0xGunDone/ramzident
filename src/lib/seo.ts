import type { Metadata } from "next";
import { env } from "@/lib/env";
import { getSiteSettings } from "@/lib/site";
import { ogSize } from "@/lib/og";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const clinicName = settings.clinicName;
  const title = `${clinicName} — стоматология для взрослых и детей в Твери`;
  const description =
    "Рамзи Дент в Твери: терапия, детская стоматология, ортодонтия, хирургия, имплантация и эстетические процедуры. Запись по телефону.";
  const ogImage = `${settings.siteUrl}/opengraph-image`;
  const twitterImage = `${settings.siteUrl}/twitter-image`;

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
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: settings.siteUrl,
      siteName: clinicName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: ogSize.width,
          height: ogSize.height,
          alt: clinicName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterImage],
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

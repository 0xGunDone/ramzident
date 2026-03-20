import "./globals.css";
import Script from "next/script";
import { Toaster } from "sonner";
import { STATIC_OG_PATHS } from "@/lib/og-paths";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site";
import { absoluteUrl } from "@/lib/url";

export { generateMetadata } from "@/lib/seo";

function parseHours(range: string): { opens: string; closes: string } {
  const [opens, closes] = range.split("-").map((s) => s.trim());
  return { opens: opens || "10:00", closes: closes || "19:00" };
}

function normalizeMetrikaId(value: string) {
  return value.replace(/[^\d]/g, "");
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, services] = await Promise.all([
    getSiteSettings(),
    prisma.service.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
      select: { title: true, slug: true },
    }),
  ]);
  const metrikaId = normalizeMetrikaId(settings.yandexMetrikaId || "");
  const gaId = (settings.googleAnalyticsId || "").trim();

  const weekdayHours = parseHours(settings.workHoursWeekdays);
  const weekendHours = parseHours(settings.workHoursWeekend);

  const addressParts = settings.address.split(",").map((s) => s.trim());
  const streetAddress =
    addressParts.length >= 4
      ? addressParts.slice(3).join(", ")
      : addressParts[addressParts.length - 1];

  const sameAs = [
    "https://yandex.ru/maps/org/ramzi_dent/180026503415/?ll=35.894276%2C56.855939&z=14",
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: settings.clinicName,
      url: absoluteUrl("/"),
      inLanguage: "ru-RU",
    },
    {
      "@context": "https://schema.org",
      "@type": "Dentist",
      name: settings.clinicName,
      image: absoluteUrl(STATIC_OG_PATHS.home),
      url: absoluteUrl("/"),
      "@id": absoluteUrl("/#organization"),
      telephone: settings.phone,
      email: settings.email || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress,
        addressLocality: settings.city,
        addressRegion: settings.region,
        postalCode: settings.postalCode,
        addressCountry: "RU",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: settings.mapPinLat,
        longitude: settings.mapPinLng,
      },
      hasMap: sameAs[0],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: weekdayHours.opens,
          closes: weekdayHours.closes,
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Saturday", "Sunday"],
          opens: weekendHours.opens,
          closes: weekendHours.closes,
        },
      ],
      sameAs,
      areaServed: settings.city,
      priceRange: "$$",
      medicalSpecialty: "Dentistry",
      hasOfferCatalog:
        services.length > 0
          ? {
              "@type": "OfferCatalog",
              name: `Услуги ${settings.clinicName}`,
              itemListElement: services.map((service) => ({
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: service.title,
                  url: absoluteUrl(`/services/${service.slug}`),
                },
              })),
            }
          : undefined,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: settings.phone,
        areaServed: "RU",
        availableLanguage: ["ru"],
      },
    },
  ];

  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = window.gtag || gtag;
                gtag('js', new Date());
                gtag('config', '${gaId}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}
        {metrikaId ? (
          <>
            <Script id="yandex-metrika" strategy="afterInteractive">
              {`
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {
                  if (document.scripts[j].src === r) { return; }
                }
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a);
                })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                ym(${metrikaId}, "init", {
                  clickmap:true,
                  trackLinks:true,
                  accurateTrackBounce:true,
                  webvisor:true
                });
              `}
            </Script>
            <noscript>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://mc.yandex.ru/watch/${metrikaId}`}
                  style={{ position: "absolute", left: "-9999px" }}
                  alt=""
                />
              </div>
            </noscript>
          </>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}

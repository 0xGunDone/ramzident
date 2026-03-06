import "./globals.css";
import { Toaster } from "sonner";
import { STATIC_OG_PATHS } from "@/lib/og-paths";
import { getSiteSettings } from "@/lib/site";
import { getTestimonialStats } from "@/lib/data";
import { absoluteUrl } from "@/lib/url";

export { generateMetadata } from "@/lib/seo";

function parseHours(range: string): { opens: string; closes: string } {
  const [opens, closes] = range.split("-").map((s) => s.trim());
  return { opens: opens || "10:00", closes: closes || "19:00" };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, stats] = await Promise.all([
    getSiteSettings(),
    getTestimonialStats(),
  ]);

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
      ...(stats.count > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: String(stats.avg),
              reviewCount: String(stats.count),
            },
          }
        : {}),
      sameAs,
      areaServed: settings.city,
      priceRange: "$$",
    },
  ];

  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}

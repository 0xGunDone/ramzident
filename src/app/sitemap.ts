import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, documents, sections, doctors, testimonials, faqItems] =
    await Promise.all([
    prisma.service.findMany({
      where: { enabled: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.siteDocument.findMany({
      where: { enabled: true, fileId: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.section.findMany({
      where: { enabled: true },
      select: { type: true, updatedAt: true },
    }),
    prisma.doctor.findMany({
      where: { enabled: true },
      select: { updatedAt: true },
    }),
    prisma.testimonial.findMany({
      where: { enabled: true },
      select: { updatedAt: true },
    }),
    prisma.faqItem.findMany({
      where: { enabled: true },
      select: { updatedAt: true },
    }),
  ]);

  const getLatestDate = (dates: Date[]) =>
    dates.length > 0
      ? dates.reduce(
          (latest, current) =>
            current.getTime() > latest.getTime() ? current : latest,
          dates[0]
        )
      : new Date();

  const latestDocumentUpdate =
    documents.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
      ?.updatedAt || new Date();
  const latestServicesUpdate = getLatestDate([
    ...services.map((service) => service.updatedAt),
    ...sections
      .filter((section) => section.type === "services")
      .map((section) => section.updatedAt),
  ]);
  const latestHomeUpdate = getLatestDate([
    ...sections.map((section) => section.updatedAt),
    ...services.map((service) => service.updatedAt),
    ...doctors.map((doctor) => doctor.updatedAt),
    ...testimonials.map((testimonial) => testimonial.updatedAt),
    ...faqItems.map((faq) => faq.updatedAt),
    ...documents.map((document) => document.updatedAt),
  ]);

  return [
    {
      url: absoluteUrl("/"),
      lastModified: latestHomeUpdate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/services"),
      lastModified: latestServicesUpdate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...services.map((service) => ({
      url: absoluteUrl(`/services/${service.slug}`),
      lastModified: service.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...(documents.length > 0
      ? [
          {
            url: absoluteUrl("/documents"),
            lastModified: latestDocumentUpdate,
            changeFrequency: "monthly" as const,
            priority: 0.6,
          },
          ...documents.map((document) => ({
            url: absoluteUrl(`/documents/${document.slug}`),
            lastModified: document.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.55,
          })),
        ]
      : []),
  ];
}

import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { isPrismaMissingTableError } from "@/lib/prisma-errors";
import { absoluteUrl } from "@/lib/url";

interface SlugWithUpdatedAt {
  slug: string;
  updatedAt: Date;
}

interface SectionWithUpdatedAt {
  type: string;
  updatedAt: Date;
}

interface UpdatedAtOnly {
  updatedAt: Date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let services: SlugWithUpdatedAt[] = [];
  let documents: SlugWithUpdatedAt[] = [];
  let sections: SectionWithUpdatedAt[] = [];
  let doctors: UpdatedAtOnly[] = [];
  let testimonials: UpdatedAtOnly[] = [];
  let faqItems: UpdatedAtOnly[] = [];

  try {
    [services, documents, sections, doctors, testimonials, faqItems] =
      await Promise.all([
        prisma.service.findMany({
          where: { enabled: true },
          select: { slug: true, updatedAt: true },
        }) as Promise<SlugWithUpdatedAt[]>,
        prisma.siteDocument.findMany({
          where: { enabled: true, fileId: { not: null } },
          select: { slug: true, updatedAt: true },
        }) as Promise<SlugWithUpdatedAt[]>,
        prisma.section.findMany({
          where: { enabled: true },
          select: { type: true, updatedAt: true },
        }) as Promise<SectionWithUpdatedAt[]>,
        prisma.doctor.findMany({
          where: { enabled: true },
          select: { updatedAt: true },
        }) as Promise<UpdatedAtOnly[]>,
        prisma.testimonial.findMany({
          where: { enabled: true },
          select: { updatedAt: true },
        }) as Promise<UpdatedAtOnly[]>,
        prisma.faqItem.findMany({
          where: { enabled: true },
          select: { updatedAt: true },
        }) as Promise<UpdatedAtOnly[]>,
      ]);
  } catch (error) {
    if (!isPrismaMissingTableError(error)) {
      throw error;
    }
  }

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
    ...services.map((service: SlugWithUpdatedAt) => service.updatedAt),
    ...sections
      .filter((section: SectionWithUpdatedAt) => section.type === "services")
      .map((section: SectionWithUpdatedAt) => section.updatedAt),
  ]);
  const latestHomeUpdate = getLatestDate([
    ...sections.map((section: SectionWithUpdatedAt) => section.updatedAt),
    ...services.map((service: SlugWithUpdatedAt) => service.updatedAt),
    ...doctors.map((doctor: UpdatedAtOnly) => doctor.updatedAt),
    ...testimonials.map((testimonial: UpdatedAtOnly) => testimonial.updatedAt),
    ...faqItems.map((faq: UpdatedAtOnly) => faq.updatedAt),
    ...documents.map((document: SlugWithUpdatedAt) => document.updatedAt),
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
    ...services.map((service: SlugWithUpdatedAt) => ({
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
          ...documents.map((document: SlugWithUpdatedAt) => ({
            url: absoluteUrl(`/documents/${document.slug}`),
            lastModified: document.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.55,
          })),
        ]
      : []),
  ];
}

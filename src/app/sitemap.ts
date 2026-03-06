import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, documents] = await Promise.all([
    prisma.service.findMany({
      where: { enabled: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.siteDocument.findMany({
      where: { enabled: true, fileId: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const latestDocumentUpdate =
    documents.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
      ?.updatedAt || new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/services"),
      lastModified: new Date(),
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

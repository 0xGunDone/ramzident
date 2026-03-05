import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.siteUrl;
  const [services, documents] = await Promise.all([
    prisma.service.findMany({
      where: { enabled: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.siteDocument.findMany({
      where: { enabled: true, fileId: { not: null } },
      select: { updatedAt: true },
    }),
  ]);

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...services.map((service) => ({
      url: `${baseUrl}/services/${service.slug}`,
      lastModified: service.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/documents`,
      lastModified:
        documents.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
          ?.updatedAt || new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}

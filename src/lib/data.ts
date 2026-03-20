import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getEnabledServices = cache(async () =>
  prisma.service.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
    include: { photo: true },
  })
);

export const getServiceBySlug = cache(async (slug: string) =>
  prisma.service.findUnique({
    where: { slug },
    include: { photo: true },
  })
);

export const getNearbyServices = cache(async (excludeSlug: string, take = 3) =>
  prisma.service.findMany({
    where: { enabled: true, NOT: { slug: excludeSlug } },
    orderBy: { order: "asc" },
    take,
  })
);

export const getEnabledDoctors = cache(async () =>
  prisma.doctor.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
    include: { photo: true },
  })
);

export const getEnabledTestimonials = cache(async () =>
  prisma.testimonial.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  })
);

export const getEnabledFaqItems = cache(async () =>
  prisma.faqItem.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  })
);

export const getEnabledDocuments = cache(async (take?: number) =>
  prisma.siteDocument.findMany({
    where: { enabled: true, fileId: { not: null } },
    orderBy: { order: "asc" },
    include: { file: true },
    ...(take ? { take } : {}),
  })
);

export const hasPublishedDocuments = cache(async () => {
  const count = await prisma.siteDocument.count({
    where: { enabled: true, fileId: { not: null } },
  });

  return count > 0;
});

export const getGalleryImages = cache(async (take = 6) =>
  prisma.media.findMany({
    where: {
      usage: "gallery",
      mimeType: { startsWith: "image/" },
    },
    orderBy: { createdAt: "asc" },
    take,
  })
);

export const getTestimonialStats = cache(async () => {
  const testimonials = await prisma.testimonial.findMany({
    where: { enabled: true },
    select: { rating: true },
  });

  if (testimonials.length === 0) return { avg: 0, count: 0 };

  const sum = testimonials.reduce((acc, t) => acc + t.rating, 0);
  return {
    avg: Math.round((sum / testimonials.length) * 10) / 10,
    count: testimonials.length,
  };
});

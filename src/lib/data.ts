import { cache } from "react";
import type { FaqItem, Media, Prisma, Service, Testimonial } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ServiceWithPhoto = Prisma.ServiceGetPayload<{
  include: { photo: true };
}>;
type DoctorWithPhoto = Prisma.DoctorGetPayload<{
  include: { photo: true };
}>;
type DocumentWithFile = Prisma.SiteDocumentGetPayload<{
  include: { file: true };
}>;

export const getEnabledServices: () => Promise<ServiceWithPhoto[]> = cache(
  async (): Promise<ServiceWithPhoto[]> =>
    prisma.service.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
      include: { photo: true },
    })
);

export const getServiceBySlug: (slug: string) => Promise<ServiceWithPhoto | null> = cache(
  async (slug: string): Promise<ServiceWithPhoto | null> =>
    prisma.service.findUnique({
      where: { slug },
      include: { photo: true },
    })
);

export const getNearbyServices: (
  excludeSlug: string,
  take?: number
) => Promise<Service[]> = cache(
  async (excludeSlug: string, take = 3): Promise<Service[]> =>
    prisma.service.findMany({
      where: { enabled: true, NOT: { slug: excludeSlug } },
      orderBy: { order: "asc" },
      take,
    })
);

export const getEnabledDoctors: () => Promise<DoctorWithPhoto[]> = cache(
  async (): Promise<DoctorWithPhoto[]> =>
    prisma.doctor.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
      include: { photo: true },
    })
);

export const getEnabledTestimonials: () => Promise<Testimonial[]> = cache(
  async (): Promise<Testimonial[]> =>
    prisma.testimonial.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    })
);

export const getEnabledFaqItems: () => Promise<FaqItem[]> = cache(
  async (): Promise<FaqItem[]> =>
    prisma.faqItem.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    })
);

export const getEnabledDocuments: (take?: number) => Promise<DocumentWithFile[]> = cache(
  async (take?: number): Promise<DocumentWithFile[]> =>
    prisma.siteDocument.findMany({
      where: { enabled: true, fileId: { not: null } },
      orderBy: { order: "asc" },
      include: { file: true },
      ...(take ? { take } : {}),
    })
);

export const hasPublishedDocuments: () => Promise<boolean> = cache(
  async (): Promise<boolean> => {
    const count = await prisma.siteDocument.count({
      where: { enabled: true, fileId: { not: null } },
    });

    return count > 0;
  }
);

export const getGalleryImages: (take?: number) => Promise<Media[]> = cache(
  async (take = 6): Promise<Media[]> =>
    prisma.media.findMany({
      where: {
        usage: "gallery",
        mimeType: { startsWith: "image/" },
      },
      orderBy: { createdAt: "asc" },
      take,
    })
);

export const getTestimonialStats: () => Promise<{ avg: number; count: number }> = cache(
  async (): Promise<{ avg: number; count: number }> => {
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
  }
);

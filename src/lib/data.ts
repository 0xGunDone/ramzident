import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getEnabledServices() {
  noStore();
  return prisma.service.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
    include: { photo: true },
  });
}

export async function getServiceBySlug(slug: string) {
  noStore();
  return prisma.service.findUnique({
    where: { slug },
    include: { photo: true },
  });
}

export async function getNearbyServices(excludeSlug: string, take = 3) {
  noStore();
  return prisma.service.findMany({
    where: { enabled: true, NOT: { slug: excludeSlug } },
    orderBy: { order: "asc" },
    take,
  });
}

export async function getEnabledDoctors() {
  noStore();
  return prisma.doctor.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
    include: { photo: true },
  });
}

export async function getEnabledTestimonials() {
  noStore();
  return prisma.testimonial.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  });
}

export async function getEnabledFaqItems() {
  noStore();
  return prisma.faqItem.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  });
}

export async function getEnabledDocuments(take?: number) {
  noStore();
  return prisma.siteDocument.findMany({
    where: { enabled: true, fileId: { not: null } },
    orderBy: { order: "asc" },
    include: { file: true },
    ...(take ? { take } : {}),
  });
}

export async function hasPublishedDocuments() {
  noStore();
  const count = await prisma.siteDocument.count({
    where: { enabled: true, fileId: { not: null } },
  });

  return count > 0;
}

export async function getGalleryImages(take = 6) {
  noStore();
  return prisma.media.findMany({
    where: {
      usage: "gallery",
      mimeType: { startsWith: "image/" },
    },
    orderBy: { createdAt: "asc" },
    take,
  });
}

export async function getTestimonialStats(): Promise<{ avg: number; count: number }> {
  noStore();
  const testimonials = await prisma.testimonial.findMany({
    where: { enabled: true },
    select: { rating: true },
  });

  if (testimonials.length === 0) return { avg: 0, count: 0 };

  const sum = testimonials.reduce(
    (acc: number, testimonial: { rating: number }) => acc + testimonial.rating,
    0
  );
  return {
    avg: Math.round((sum / testimonials.length) * 10) / 10,
    count: testimonials.length,
  };
}

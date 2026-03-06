import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { createSocialMetadata } from "@/lib/metadata";
import { getServicesIndexStaticOgPath } from "@/lib/og-static";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return createSocialMetadata({
    title: "Услуги",
    description:
      "Стоматологические услуги клиники Рамзи Дент в Твери: терапия, хирургия, имплантация, ортодонтия, детская стоматология, эстетические процедуры.",
    imageAlt: "Услуги Рамзи Дент",
    ogPath: await getServicesIndexStaticOgPath(),
    canonicalPath: "/services",
    openGraphUrl: "/services",
  });
}

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { enabled: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="section-space">
        <div className="site-container space-y-10">
          <SectionHeading
            eyebrow="Услуги"
            title="Страницы основных направлений"
            description="Каждая услуга получила отдельную SEO-страницу, чтобы пациент мог быстро понять направление и перейти к звонку в клинику."
            as="h1"
          />

          <div className="grid gap-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.slug}`}
                className="surface-card flex flex-col gap-3 rounded-[1.8rem] px-6 py-6 transition-transform hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--ink-strong)]">
                    {service.title}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                    {service.summary || service.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  {service.priceFrom ? (
                    <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-[var(--ink)]">
                      {service.priceFrom}
                    </span>
                  ) : null}
                  {service.duration ? (
                    <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-[var(--ink)]">
                      {service.duration}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

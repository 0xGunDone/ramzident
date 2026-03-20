import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PhoneLink from "@/components/ui/PhoneLink";
import { isUploadedMediaPath } from "@/lib/images";
import { createSocialMetadata } from "@/lib/metadata";
import { getServiceStaticOgPathWithVersion } from "@/lib/og-paths";
import { prisma } from "@/lib/prisma";
import { getServiceDetailContent } from "@/lib/service-details";
import { getSiteSettings } from "@/lib/site";
import { absoluteUrl } from "@/lib/url";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

interface ServiceSlugParam {
  slug: string;
}

interface NearbyServiceLink {
  id: string;
  slug: string;
  title: string;
}

type ServiceWithPhoto = Prisma.ServiceGetPayload<{
  include: { photo: true };
}>;

function DetailCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="surface-card rounded-[1.8rem] px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
        {title}
      </p>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--ink)]">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function generateStaticParams() {
  const services: ServiceSlugParam[] = await prisma.service.findMany({
    where: { enabled: true },
    select: { slug: true },
  });

  return services.map((service: ServiceSlugParam) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const [service, settings] = await Promise.all([
    prisma.service.findUnique({ where: { slug } }),
    getSiteSettings(),
  ]);

  if (!service) {
    return {};
  }

  return createSocialMetadata({
    title: `${service.seoTitle || service.title} | ${settings.clinicName}`,
    description: service.seoDescription || service.summary || service.description,
    imageAlt: service.title,
    ogPath: getServiceStaticOgPathWithVersion(service),
    canonicalPath: `/services/${slug}`,
    openGraphUrl: `/services/${slug}`,
  });
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const [service, settings, nearbyServices] = await Promise.all([
    prisma.service.findUnique({
      where: { slug },
      include: { photo: true },
    }) as Promise<ServiceWithPhoto | null>,
    getSiteSettings(),
    prisma.service.findMany({
      where: { enabled: true, NOT: { slug } },
      orderBy: { order: "asc" },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
      },
    }) as Promise<NearbyServiceLink[]>,
  ]);

  if (!service || !service.enabled) {
    notFound();
  }

  const paragraphs = (service.body || service.description)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const detailContent = getServiceDetailContent(service.slug);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Услуги",
        item: absoluteUrl("/services"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: absoluteUrl(`/services/${service.slug}`),
      },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    serviceType: service.title,
    category: "Стоматология",
    description: service.seoDescription || service.summary || service.description,
    url: absoluteUrl(`/services/${service.slug}`),
    areaServed: {
      "@type": "City",
      name: settings.city,
    },
    provider: {
      "@type": "Dentist",
      name: settings.clinicName,
      url: absoluteUrl("/"),
      telephone: settings.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.address,
        addressLocality: settings.city,
        addressRegion: settings.region,
        postalCode: settings.postalCode,
        addressCountry: "RU",
      },
    },
    ...(service.priceFrom
      ? {
          offers: {
            "@type": "Offer",
            url: absoluteUrl(`/services/${service.slug}`),
            priceSpecification: {
              "@type": "PriceSpecification",
              priceCurrency: "RUB",
              description: service.priceFrom,
            },
          },
        }
      : {}),
  };

  const faqSchema =
    detailContent && detailContent.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: detailContent.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="section-space">
        <div className="site-container space-y-10">
          <nav aria-label="Хлебные крошки" className="text-sm text-[var(--muted)]">
            <Link href="/">Главная</Link> / <Link href="/services">Услуги</Link> /{" "}
            <span className="text-[var(--ink)]">{service.title}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div className="space-y-7">
              <div className="space-y-4">
                <span className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Направление клиники
                </span>
                <h1 className="font-display text-5xl leading-[0.94] text-[var(--ink-strong)] md:text-6xl">
                  {service.title}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">
                  {service.summary || service.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-[var(--ink)]">
                {service.priceFrom ? (
                  <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2">
                    {service.priceFrom}
                  </span>
                ) : null}
                {service.duration ? (
                  <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2">
                    {service.duration}
                  </span>
                ) : null}
                {service.badge ? (
                  <span className="rounded-full border border-[var(--line)] bg-white/80 px-4 py-2">
                    {service.badge}
                  </span>
                ) : null}
              </div>

              <div className="space-y-4 text-base leading-8 text-[var(--muted)]">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              {detailContent ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailCard
                    title="Когда стоит записаться"
                    items={detailContent.whenNeeded}
                  />
                  <DetailCard
                    title="Что может входить"
                    items={detailContent.includes}
                  />
                  <DetailCard
                    title="Как проходит приём"
                    items={detailContent.visitFlow}
                  />
                  <DetailCard
                    title="Что влияет на стоимость"
                    items={detailContent.pricingFactors}
                  />
                </div>
              ) : null}

              <div className="surface-card rounded-[2rem] px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Запись на услугу
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Позвоните в клинику, и мы подберём удобное время для консультации
                  или лечения.
                </p>
                <PhoneLink
                  phone={settings.phone}
                  rawPhone={settings.phoneRaw}
                  label={`Позвонить: ${settings.phone}`}
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-semibold text-white"
                />
              </div>

              {detailContent && detailContent.faq.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                      FAQ по услуге
                    </p>
                    <h2 className="font-display text-3xl leading-none text-[var(--ink-strong)]">
                      Частые вопросы перед записью
                    </h2>
                  </div>
                  <div className="grid gap-4">
                    {detailContent.faq.map((item) => (
                      <details
                        key={item.question}
                        className="surface-card group rounded-[1.8rem] px-5 py-5"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold leading-snug text-[var(--ink-strong)]">
                          {item.question}
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white text-lg transition-transform duration-300 group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="surface-card overflow-hidden rounded-[2rem] p-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.7rem]">
                  {service.photo ? (
                    <Image
                      src={service.photo.path}
                      alt={service.photo.altText || service.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      unoptimized={isUploadedMediaPath(service.photo.path)}
                    />
                  ) : (
                    <div className="h-full w-full bg-[linear-gradient(135deg,rgba(23,60,67,0.9),rgba(41,86,95,0.94))]" />
                  )}
                </div>
              </div>

              {nearbyServices.length > 0 ? (
                <div className="surface-card rounded-[2rem] px-6 py-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                    Другие услуги
                  </p>
                  <div className="mt-4 flex flex-col gap-4">
                    {nearbyServices.map((item: NearbyServiceLink) => (
                      <Link
                        key={item.id}
                        href={`/services/${item.slug}`}
                        className="rounded-[1.4rem] border border-[var(--line)] bg-white/75 px-4 py-4 text-sm font-semibold text-[var(--ink)]"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqSchema
              ? [breadcrumbSchema, serviceSchema, faqSchema]
              : [breadcrumbSchema, serviceSchema]
          ),
        }}
      />
    </div>
  );
}

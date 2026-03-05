import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PhoneLink from "@/components/ui/PhoneLink";
import { createSocialMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const services = await prisma.service.findMany({
    where: { enabled: true },
    select: { slug: true },
  });

  return services.map((service) => ({ slug: service.slug }));
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

  const ogImage = `${settings.siteUrl}/services/${slug}/opengraph-image`;
  const twitterImage = `${settings.siteUrl}/services/${slug}/twitter-image`;

  return createSocialMetadata({
    title: service.seoTitle || service.title,
    description: service.seoDescription || service.summary || service.description,
    imageAlt: service.title,
    ogPath: ogImage,
    twitterPath: twitterImage,
    openGraphUrl: `${settings.siteUrl}/services/${slug}`,
  });
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const [service, settings, nearbyServices] = await Promise.all([
    prisma.service.findUnique({
      where: { slug },
      include: { photo: true },
    }),
    getSiteSettings(),
    prisma.service.findMany({
      where: { enabled: true, NOT: { slug } },
      orderBy: { order: "asc" },
      take: 3,
    }),
  ]);

  if (!service || !service.enabled) {
    notFound();
  }

  const paragraphs = (service.body || service.description)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="section-space">
        <div className="site-container space-y-10">
          <nav className="text-sm text-[var(--muted)]">
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

              <div className="surface-card rounded-[2rem] px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Запись на услугу
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Для записи на консультацию или лечение позвоните в клинику. Онлайн
                  формы на сайте не используются.
                </p>
                <PhoneLink
                  phone={settings.phone}
                  rawPhone={settings.phoneRaw}
                  label={`Позвонить: ${settings.phone}`}
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-semibold text-white"
                />
              </div>
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
                    {nearbyServices.map((item) => (
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
    </div>
  );
}

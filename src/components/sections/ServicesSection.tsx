import Link from "next/link";
import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { isUploadedMediaPath } from "@/lib/images";
import { getServiceDetailContent } from "@/lib/service-details";
import { getSectionByType, parseSectionContent } from "@/lib/site";
import { prisma } from "@/lib/prisma";

const iconMap: Record<string, string> = {
  spark:
    "M12 4.75 13.66 8.9 18 10.56 13.66 12.22 12 16.37 10.34 12.22 6 10.56 10.34 8.9 12 4.75Z",
  heart:
    "M12 20.25S4 15.55 4 9.8C4 7.05 6.2 5 8.85 5c1.54 0 3.04.72 3.99 1.94A5.05 5.05 0 0 1 16.83 5C19.48 5 21.7 7.05 21.7 9.8c0 5.75-8.02 10.45-8.02 10.45H12Z",
  shield:
    "M12 3.75 19 6.6v5.55c0 4.47-2.74 8.55-7 9.95-4.26-1.4-7-5.48-7-9.95V6.6l7-2.85Z",
  crown:
    "M4 18.25 6.1 8.5l5.15 4.2L15.1 7l3.8 5.7L20 8.5l2 9.75H4Z",
  align:
    "M6 5.5h12M4.5 10.5h15M6 15.5h12M8.5 20.5h7",
  smile:
    "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm-3.5-7a4.2 4.2 0 0 0 7 0M9 10.5h.01M15 10.5h.01",
};

interface ServicesSectionContent {
  description: string;
}

const fallbackContent: ServicesSectionContent = {
  description: "Ключевые направления клиники с понятными карточками и звонком в один тап.",
};

const DELAYS = ["", "delay-1", "delay-2", "delay-3", "delay-4", "delay-5", "delay-6"];

export default async function ServicesSection() {
  const [section, services] = await Promise.all([
    getSectionByType("services"),
    prisma.service.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
      include: { photo: true },
    }),
  ]);

  if (!section?.enabled) return null;
  const content = parseSectionContent(section.content, fallbackContent);

  return (
    <section id="services" className="section-space">
      <div className="site-container space-y-10">
        <SectionHeading
          eyebrow="Услуги"
          title={section.title || "Направления клиники"}
          description={content.description}
          align="center"
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const detail = getServiceDetailContent(service.slug);

            return (
              <article
                key={service.id}
                className={`surface-card group flex flex-col overflow-hidden rounded-[2rem] animate-in ${DELAYS[Math.min(i + 1, 6)]}`}
              >
              <div className="relative aspect-[16/10] overflow-hidden">
                {service.photo ? (
                  <Image
                    src={service.photo.path}
                    alt={service.photo.altText || service.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={isUploadedMediaPath(service.photo.path)}
                  />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(201,176,113,0.22),transparent_38%),linear-gradient(135deg,rgba(23,60,67,0.9),rgba(41,86,95,0.92))]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,44,51,0.7)] via-transparent to-transparent" />
                {service.badge ? (
                  <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                    {service.badge}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-xl font-semibold leading-tight text-[var(--ink-strong)]">
                      {service.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-7 text-[var(--muted)]">
                      {service.summary || service.description}
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgba(201,176,113,0.12)] text-[var(--accent)]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                      <path
                        d={iconMap[service.icon || "spark"] || iconMap.spark}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.7"
                      />
                    </svg>
                  </span>
                </div>

                {service.priceFrom || service.duration ? (
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--ink)]">
                    {service.priceFrom ? (
                      <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5">
                        {service.priceFrom}
                      </span>
                    ) : null}
                    {service.duration ? (
                      <span className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5">
                        {service.duration}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {detail ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                      Подходит, если
                    </p>
                    <ul className="space-y-2 text-sm leading-6 text-[var(--muted)]">
                      {detail.whenNeeded.slice(0, 2).map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-strong)] transition-colors hover:text-[var(--accent)]"
                  >
                    Подробнее
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                      <path
                        d="m8 5 5 5-5 5"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.7"
                      />
                    </svg>
                  </Link>
                  <Link
                    href="/#contacts"
                    className="rounded-full border border-[var(--line)] bg-white/60 px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-all duration-300 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  >
                    Записаться
                  </Link>
                </div>
              </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

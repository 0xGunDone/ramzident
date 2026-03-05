import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { prisma } from "@/lib/prisma";
import { getSectionByType, parseSectionContent } from "@/lib/site";

interface TestimonialsContent {
  rating: string;
  reviewCount: string;
  sourceLabel: string;
  sourceUrl: string;
}

const fallbackContent: TestimonialsContent = {
  rating: "4.7",
  reviewCount: "41",
  sourceLabel: "Яндекс Карты",
  sourceUrl:
    "https://yandex.ru/maps/org/ramzi_dent/180026503415/?ll=35.894276%2C56.855939&z=14",
};

const DELAYS = ["", "delay-1", "delay-2", "delay-3", "delay-4", "delay-5", "delay-6"];

export default async function TestimonialsSection() {
  const [section, testimonials] = await Promise.all([
    getSectionByType("testimonials"),
    prisma.testimonial.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!section?.enabled || testimonials.length === 0) return null;

  const content = parseSectionContent(section.content, fallbackContent);

  return (
    <section id="testimonials" className="section-space">
      <div className="site-container space-y-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeading
            eyebrow="Доверие"
            title={section.title || "Пациенты отмечают спокойный сервис"}
            description="Вместо вымышленных оценок сайт показывает фактический рейтинг и мягко пересобранные темы из отзывов."
          />
          <div className="surface-card flex flex-col gap-4 rounded-[2rem] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Актуальная база доверия
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                По данным {content.sourceLabel} у клиники {content.reviewCount}{" "}
                отзывов с рейтингом {content.rating}.
              </p>
            </div>
            <Link
              href={content.sourceUrl}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition-all duration-300 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              Яндекс Карты
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <article
              key={testimonial.id}
              className={`surface-card flex flex-col rounded-[2rem] p-6 animate-in ${DELAYS[Math.min(i + 1, 6)]}`}
            >
              <div className="flex items-center gap-1 text-[var(--accent)]">
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <svg key={index} viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="m12 17.27 5.18 3.14-1.38-5.9 4.58-3.97-6.03-.5L12 4.5l-2.35 5.54-6.03.5 4.58 3.97-1.38 5.9L12 17.27Z" />
                  </svg>
                ))}
              </div>
              <p className="mt-5 flex-1 text-base leading-8 text-[var(--ink)]">
                {testimonial.quote}
              </p>
              <div className="mt-6 border-t border-[var(--line)] pt-5">
                <p className="text-sm font-semibold text-[var(--ink-strong)]">
                  {testimonial.author}
                </p>
                {testimonial.role ? (
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                    {testimonial.role}
                  </p>
                ) : null}
                {testimonial.source ? (
                  <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                    {testimonial.source}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { getSectionByType, parseSectionContent } from "@/lib/site";

interface AboutContent {
  description: string;
  paragraphs: string[];
  imagePath: string;
  highlights: string[];
}

const fallbackContent: AboutContent = {
  description:
    "Клиника сочетает квалификацию врачей, современное оборудование и спокойный сервис для взрослых и детей.",
  paragraphs: [],
  imagePath: "/media/about/clinic-facade.webp",
  highlights: [],
};

export default async function AboutSection() {
  const section = await getSectionByType("about");
  if (!section?.enabled) return null;

  const content = parseSectionContent(section.content, fallbackContent);

  return (
    <section id="about" className="section-space">
      <div className="site-container grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
        <div className="relative">
          <div className="absolute inset-0 translate-x-5 translate-y-5 rounded-[2.2rem] bg-[rgba(201,176,113,0.16)]" />
          <div className="surface-card relative overflow-hidden rounded-[2.2rem] p-3">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.8rem]">
              <Image
                src={content.imagePath}
                alt="Фасад клиники Рамзи Дент"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <SectionHeading
            eyebrow="О клинике"
            title={section.title || "Клиника с понятным и спокойным сервисом"}
            description={content.description}
          />

          <div className="space-y-4 text-base leading-8 text-[var(--muted)]">
            {content.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {content.highlights.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {content.highlights.map((item) => (
                <div
                  key={item}
                  className="surface-card flex items-start gap-4 rounded-[1.8rem] px-5 py-5"
                >
                  <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(201,176,113,0.18)] text-[var(--accent)]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                      <path
                        d="M5 12.5 9.2 16.7 19 7"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.9"
                      />
                    </svg>
                  </span>
                  <p className="text-sm leading-7 text-[var(--ink)]">{item}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

import SectionHeading from "@/components/ui/SectionHeading";
import { prisma } from "@/lib/prisma";
import { getSectionByType, parseSectionContent } from "@/lib/site";

interface FAQContent {
  description: string;
}

const fallbackContent: FAQContent = {
  description: "Короткие ответы на основные организационные вопросы.",
};

const DELAYS = ["", "delay-1", "delay-2", "delay-3", "delay-4", "delay-5", "delay-6"];

export default async function FAQSection() {
  const [section, faqItems] = await Promise.all([
    getSectionByType("faq"),
    prisma.faqItem.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!section?.enabled || faqItems.length === 0) return null;

  const content = parseSectionContent(section.content, fallbackContent);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section id="faq" className="section-space">
      <div className="site-container space-y-10">
        <SectionHeading
          eyebrow="FAQ"
          title={section.title || "Частые вопросы"}
          description={content.description}
        />

        <div className="grid gap-4">
          {faqItems.map((item, i) => (
            <details
              key={item.id}
              className={`surface-card group rounded-[2rem] px-6 py-6 animate-in ${DELAYS[Math.min(i + 1, 6)]}`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold leading-snug text-[var(--ink-strong)]">
                {item.question}
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white text-lg transition-transform duration-300 group-open:rotate-45">
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </section>
  );
}

import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";
import { prisma } from "@/lib/prisma";
import { getSectionByType, parseSectionContent } from "@/lib/site";

interface DocumentsContent {
  description: string;
}

const fallbackContent: DocumentsContent = {
  description: "Лицензии, политика, оферта и другие обязательные документы.",
};

export default async function DocumentsSection() {
  const [section, documents] = await Promise.all([
    getSectionByType("documents"),
    prisma.siteDocument.findMany({
      where: { enabled: true, fileId: { not: null } },
      orderBy: { order: "asc" },
      include: { file: true },
      take: 4,
    }),
  ]);

  if (!section?.enabled) return null;

  const content = parseSectionContent(section.content, fallbackContent);

  return (
    <section id="documents" className="section-space">
      <div className="site-container space-y-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHeading
            eyebrow="Документы"
            title={section.title || "Юридически важный раздел без заглушек"}
            description={content.description}
          />
          <Link
            href="/documents"
            className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/80 px-6 py-3 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]"
          >
            Открыть раздел документов
          </Link>
        </div>

        {documents.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {documents.map((document) => (
              <article
                key={document.id}
                className="surface-card rounded-[1.8rem] px-6 py-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {document.type}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--ink-strong)]">
                  {document.title}
                </h3>
                {document.description ? (
                  <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                    {document.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card rounded-[2rem] px-6 py-8 text-sm leading-7 text-[var(--muted)]">
            Раздел уже подготовлен под лицензии, политику и оферту. Как только
            файлы будут загружены в админке, они автоматически появятся здесь и
            на отдельной странице документов.
          </div>
        )}
      </div>
    </section>
  );
}

import Link from "next/link";
import type { Prisma } from "@prisma/client";
import SectionHeading from "@/components/ui/SectionHeading";
import { prisma } from "@/lib/prisma";
import { getSectionByType, parseSectionContent } from "@/lib/site";

interface DocumentsContent {
  description: string;
}

const fallbackContent: DocumentsContent = {
  description: "Лицензии, политика, оферта и другие обязательные документы.",
};
type SectionDocumentItem = Prisma.SiteDocumentGetPayload<{
  include: { file: true };
}>;

export default async function DocumentsSection() {
  const [section, documents] = await Promise.all([
    getSectionByType("documents"),
    prisma.siteDocument.findMany({
      where: { enabled: true, fileId: { not: null } },
      orderBy: { order: "asc" },
      include: { file: true },
      take: 4,
    }) as Promise<SectionDocumentItem[]>,
  ]);

  if (!section?.enabled || documents.length === 0) return null;

  const content = parseSectionContent(section.content, fallbackContent);

  return (
    <section id="documents" className="section-space">
      <div className="site-container space-y-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHeading
            eyebrow="Документы"
            title={section.title || "Официальные документы клиники"}
            description={content.description}
          />
          <Link
            href="/documents"
            className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/80 px-6 py-3 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]"
          >
            Открыть раздел документов
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {documents.map((document: SectionDocumentItem) => (
            <article
              key={document.id}
              className="surface-card rounded-[1.8rem] px-6 py-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                {document.type}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--ink-strong)]">
                <Link
                  href={`/documents/${document.slug}`}
                  className="transition-colors hover:text-[var(--accent)]"
                >
                  {document.title}
                </Link>
              </h3>
              {document.description ? (
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {document.description}
                </p>
              ) : null}
              <div className="mt-4">
                <Link
                  href={`/documents/${document.slug}`}
                  className="text-sm font-semibold text-[var(--ink)] underline-offset-4 hover:underline"
                >
                  Подробнее
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

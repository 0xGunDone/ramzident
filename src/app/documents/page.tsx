import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Документы",
  description:
    "Лицензии, политика конфиденциальности и обязательная информация стоматологической клиники Рамзи Дент в Твери.",
};

export default async function DocumentsPage() {
  const documents = await prisma.siteDocument.findMany({
    where: { enabled: true, fileId: { not: null } },
    orderBy: { order: "asc" },
    include: { file: true },
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="section-space">
        <div className="site-container space-y-10">
          <SectionHeading
            eyebrow="Документы"
            title="Лицензии, политика и обязательная информация"
            description="Раздел подготовлен как отдельная публичная зона для всех юридически значимых документов клиники."
            as="h1"
          />

          {documents.length > 0 ? (
            <div className="grid gap-4">
              {documents.map((document) => (
                <a
                  key={document.id}
                  href={document.file?.path || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="surface-card flex flex-col gap-3 rounded-[1.8rem] px-6 py-6 transition-transform hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                      {document.type}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-[var(--ink-strong)]">
                      {document.title}
                    </h2>
                    {document.description ? (
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                        {document.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--ink)]">
                    Открыть файл
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="surface-card rounded-[2rem] px-6 py-8 text-base leading-8 text-[var(--muted)]">
              Раздел уже создан. После загрузки лицензий, политики и оферты в
              админке документы автоматически появятся на этой странице.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

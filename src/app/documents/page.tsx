import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PhoneLink from "@/components/ui/PhoneLink";
import SectionHeading from "@/components/ui/SectionHeading";
import { createSocialMetadata } from "@/lib/metadata";
import { getDocumentsIndexStaticOgPath } from "@/lib/og-static";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site";

interface DocumentsListItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: string;
  file: { path: string } | null;
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const documentsCount = await prisma.siteDocument.count({
    where: { enabled: true, fileId: { not: null } },
  });

  return createSocialMetadata({
    title: "Документы",
    description:
      "Лицензии, политика конфиденциальности и обязательная информация стоматологической клиники Рамзи Дент в Твери.",
    imageAlt: "Документы Рамзи Дент",
    ogPath: await getDocumentsIndexStaticOgPath(),
    canonicalPath: "/documents",
    openGraphUrl: "/documents",
    noindex: documentsCount === 0,
  });
}

export default async function DocumentsPage() {
  const [documents, settings] = await Promise.all([
    prisma.siteDocument.findMany({
      where: { enabled: true, fileId: { not: null } },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        file: {
          select: {
            path: true,
          },
        },
      },
    }) as Promise<DocumentsListItem[]>,
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="section-space">
        <div className="site-container space-y-10">
          <SectionHeading
            eyebrow="Документы"
            title="Документы клиники"
            description="Лицензии, политика конфиденциальности и другая официальная информация."
            as="h1"
          />

          {documents.length > 0 ? (
            <div className="grid gap-4">
              {documents.map((document) => (
                <article
                  key={document.id}
                  className="surface-card flex flex-col gap-3 rounded-[1.8rem] px-6 py-6 transition-transform hover:-translate-y-0.5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                      {document.type}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-[var(--ink-strong)]">
                      <Link href={`/documents/${document.slug}`} className="transition-colors hover:text-[var(--accent)]">
                        {document.title}
                      </Link>
                    </h2>
                    {document.description ? (
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                        {document.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/documents/${document.slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--ink)]"
                    >
                      Подробнее
                    </Link>
                    {document.file?.path ? (
                      <a
                        href={document.file.path}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-white"
                      >
                        Открыть файл
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-card grid gap-6 rounded-[2rem] px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <h2 className="text-2xl font-semibold text-[var(--ink-strong)]">
                  Официальные документы можно запросить у клиники
                </h2>
                <p className="mt-4 text-base leading-8 text-[var(--muted)]">
                  Когда лицензии, политика обработки данных и другие документы
                  будут загружены в систему, они появятся в этом разделе. Пока
                  что нужную информацию можно уточнить по телефону.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-[1.6rem] border border-[var(--line)] bg-white/75 px-5 py-5 text-sm leading-7 text-[var(--ink)]">
                  Лицензии и разрешительные документы
                </div>
                <div className="rounded-[1.6rem] border border-[var(--line)] bg-white/75 px-5 py-5 text-sm leading-7 text-[var(--ink)]">
                  Политика обработки персональных данных
                </div>
                <div className="flex flex-col gap-3 pt-1">
                  <PhoneLink
                    phone={settings.phone}
                    rawPhone={settings.phoneRaw}
                    label={`Позвонить: ${settings.phone}`}
                    className="inline-flex items-center justify-center rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-white"
                  />
                  <Link
                    href="/#contacts"
                    className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--ink)]"
                  >
                    Контакты клиники
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { isUploadedMediaPath } from "@/lib/images";
import { createSocialMetadata } from "@/lib/metadata";
import { getDocumentStaticOgPathWithVersion } from "@/lib/og-paths";
import { prisma } from "@/lib/prisma";
import { isPrismaMissingTableError } from "@/lib/prisma-errors";
import { absoluteUrl } from "@/lib/url";

interface DocumentPageProps {
  params: Promise<{ slug: string }>;
}

interface RelatedDocumentLink {
  id: string;
  slug: string;
  title: string;
}

function getDocumentFileTypeLabel(mimeType: string | null | undefined) {
  if (!mimeType) return "Файл";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Изображение";
  return mimeType;
}

async function getDocumentBySlug(slug: string) {
  return prisma.siteDocument.findUnique({
    where: { slug },
    include: { file: true },
  });
}

export async function generateStaticParams() {
  try {
    const documents = await prisma.siteDocument.findMany({
      where: { enabled: true, fileId: { not: null } },
      select: { slug: true },
    });

    return documents.map((document: { slug: string }) => ({
      slug: document.slug,
    }));
  } catch (error) {
    if (isPrismaMissingTableError(error)) {
      return [];
    }

    throw error;
  }
}

export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = await getDocumentBySlug(slug);

  if (!document || !document.enabled || !document.file) {
    return {};
  }

  return createSocialMetadata({
    title: document.title,
    description:
      document.description ||
      `${document.type} стоматологической клиники Рамзи Дент в Твери.`,
    imageAlt: document.title,
    ogPath: getDocumentStaticOgPathWithVersion(document),
    canonicalPath: `/documents/${slug}`,
    openGraphUrl: `/documents/${slug}`,
  });
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { slug } = await params;
  const [document, relatedDocuments] = await Promise.all([
    getDocumentBySlug(slug),
    prisma.siteDocument
      .findMany({
        where: { enabled: true, fileId: { not: null }, NOT: { slug } },
        orderBy: { order: "asc" },
        take: 3,
        select: {
          id: true,
          slug: true,
          title: true,
        },
      }) as Promise<RelatedDocumentLink[]>,
  ]);

  if (!document || !document.enabled || !document.file) {
    notFound();
  }

  const isPdfDocument = document.file.mimeType === "application/pdf";
  const isImageDocument = document.file.mimeType.startsWith("image/");

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
        name: "Документы",
        item: absoluteUrl("/documents"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: document.title,
        item: absoluteUrl(`/documents/${document.slug}`),
      },
    ],
  };

  const documentSchema = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: document.title,
    description:
      document.description ||
      `${document.type} стоматологической клиники Рамзи Дент в Твери.`,
    url: absoluteUrl(`/documents/${document.slug}`),
    fileFormat: document.file.mimeType,
    encodingFormat: document.file.mimeType,
    about: "Стоматологическая клиника Рамзи Дент",
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="section-space">
        <div className="site-container space-y-10">
          <nav aria-label="Хлебные крошки" className="text-sm text-[var(--muted)]">
            <Link href="/">Главная</Link> / <Link href="/documents">Документы</Link> /{" "}
            <span className="text-[var(--ink)]">{document.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {document.type}
                </p>
                <h1 className="font-display text-5xl leading-[0.94] text-[var(--ink-strong)] md:text-6xl">
                  {document.title}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-[var(--muted)]">
                  {document.description ||
                    "Здесь можно открыть или скачать оригинал документа."}
                </p>
              </div>

              <div className="surface-card rounded-[2rem] px-6 py-6">
                <p className="text-sm leading-8 text-[var(--muted)]">
                  {isPdfDocument
                    ? "PDF можно открыть в браузере, пролистать на странице ниже или скачать."
                    : isImageDocument
                      ? "Изображение можно посмотреть прямо на странице или открыть отдельно в полном размере."
                      : "Откройте файл в браузере или скачайте его на устройство."}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a
                    href={document.file.path}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-semibold text-white"
                  >
                    {isPdfDocument
                      ? "Открыть PDF"
                      : isImageDocument
                        ? "Открыть изображение"
                        : "Открыть документ"}
                  </a>
                  <a
                    href={document.file.path}
                    download
                    className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold text-[var(--ink)]"
                  >
                    Скачать файл
                  </a>
                </div>
              </div>

              {isPdfDocument ? (
                <div className="surface-card overflow-hidden rounded-[2rem] p-3">
                  <div className="overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-white">
                    <iframe
                      src={document.file.path}
                      title={`Предпросмотр ${document.title}`}
                      className="h-[780px] w-full"
                    />
                  </div>
                </div>
              ) : null}

              {isImageDocument ? (
                <div className="surface-card overflow-hidden rounded-[2rem] p-3">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-[rgba(247,241,230,0.7)]">
                    <Image
                      src={document.file.path}
                      alt={document.file.altText || document.title}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      unoptimized={isUploadedMediaPath(document.file.path)}
                    />
                  </div>
                </div>
              ) : null}
            </article>

            <aside className="space-y-6">
              <div className="surface-card rounded-[2rem] px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  Информация
                </p>
                <dl className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                  <div>
                    <dt className="font-semibold text-[var(--ink)]">Тип</dt>
                    <dd>{document.type}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--ink)]">Формат файла</dt>
                    <dd>
                      {getDocumentFileTypeLabel(document.file.mimeType)}
                      <span className="ml-2 text-xs text-[var(--muted)]">
                        {document.file.mimeType}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--ink)]">Обновлён</dt>
                    <dd>{new Intl.DateTimeFormat("ru-RU").format(document.updatedAt)}</dd>
                  </div>
                </dl>
              </div>

              {relatedDocuments.length > 0 ? (
                <div className="surface-card rounded-[2rem] px-6 py-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                    Другие документы
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    {relatedDocuments.map((item: RelatedDocumentLink) => (
                      <Link
                        key={item.id}
                        href={`/documents/${item.slug}`}
                        className="rounded-[1.4rem] border border-[var(--line)] bg-white/75 px-4 py-4 text-sm font-semibold text-[var(--ink)]"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbSchema, documentSchema]),
        }}
      />
    </div>
  );
}

import Link from "next/link";
import LogoIcon from "@/components/ui/LogoIcon";
import PhoneLink from "@/components/ui/PhoneLink";
import { getEnabledDocuments } from "@/lib/data";
import { getSiteSettings } from "@/lib/site";
import { prisma } from "@/lib/prisma";

interface FooterServiceLink {
  id: string;
  slug: string;
  title: string;
}

interface FooterDocumentLink {
  id: string;
  slug: string;
  title: string;
}

export default async function Footer() {
  const [settings, services, documents] = await Promise.all([
    getSiteSettings(),
    prisma.service.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
      take: 4,
      select: {
        id: true,
        slug: true,
        title: true,
      },
    }) as Promise<FooterServiceLink[]>,
    getEnabledDocuments(3) as Promise<FooterDocumentLink[]>,
  ]);

  return (
    <footer className="border-t border-white/40 bg-[var(--ink-strong)] text-white">
      <div className="site-container py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.9fr_0.9fr_1fr]">
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-[1.2rem] bg-white/10 p-2.5">
                <LogoIcon />
              </span>
              <span className="flex flex-col">
                <span className="font-display text-3xl leading-none">
                  {settings.clinicName}
                </span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent-soft)]">
                  стоматологическая клиника
                </span>
              </span>
            </Link>
            <p className="max-w-md text-sm leading-7 text-white/72">
              Спокойная стоматология для взрослых и детей в центре Твери:
              терапия, детский приём, ортодонтия, хирургия, имплантация и
              эстетические процедуры.
            </p>
            <PhoneLink
              phone={settings.phone}
              rawPhone={settings.phoneRaw}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-soft)]">
              Навигация
            </h3>
            <div className="flex flex-col gap-3 text-sm text-white/75">
              <Link href="/#about">О клинике</Link>
              <Link href="/#services">Услуги</Link>
              <Link href="/#doctors">Врачи</Link>
              <Link href="/#contacts">Контакты</Link>
              {documents.length > 0 ? <Link href="/documents">Документы</Link> : null}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-soft)]">
              Услуги
            </h3>
            <div className="flex flex-col gap-3 text-sm text-white/75">
              {services.map((service: FooterServiceLink) => (
                <Link key={service.id} href={`/services/${service.slug}`}>
                  {service.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-soft)]">
              Контакты
            </h3>
            <div className="space-y-3 text-sm leading-7 text-white/75">
              <p>{settings.address}</p>
              <p>
                Пн-Пт: {settings.workHoursWeekdays}
                <br />
                Сб-Вс: {settings.workHoursWeekend}
              </p>
              {documents.length > 0 ? (
                <div className="flex flex-col gap-2 pt-2">
                  {documents.map((document: FooterDocumentLink) => (
                    <Link key={document.id} href={`/documents/${document.slug}`}>
                      {document.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <p>
            {settings.copyrightText ||
              `© ${new Date().getFullYear()} ${settings.clinicName}. Все права защищены.`}
          </p>
          <div className="flex items-center gap-4">
            {settings.creatorName ? (
              settings.creatorUrl ? (
                <a
                  href={settings.creatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Сделано: {settings.creatorName}
                </a>
              ) : (
                <span>Сделано: {settings.creatorName}</span>
              )
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

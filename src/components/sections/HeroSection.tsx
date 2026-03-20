import Image from "next/image";
import Link from "next/link";
import PhoneLink from "@/components/ui/PhoneLink";
import { isUploadedMediaPath } from "@/lib/images";
import { getSectionByType, getSiteSettings, parseSectionContent } from "@/lib/site";

interface HeroContent {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  imagePath: string;
  trustItems: { value: string; label: string }[];
  badges: string[];
}

const fallbackContent: HeroContent = {
  eyebrow: "Стоматология на улице Брагина",
  title: "Стоматология для взрослых и детей",
  accent: "с понятным маршрутом лечения и записью по телефону",
  description:
    "Рамзи Дент объединяет терапию, детский приём, хирургию, имплантацию, ортодонтию и эстетическую стоматологию в одной клинике.",
  primaryLabel: "Позвонить и записаться",
  secondaryLabel: "Посмотреть услуги",
  imagePath: "/media/hero/clinic-hero.webp",
  trustItems: [],
  badges: [],
};

const heroScenarios = [
  {
    href: "/services/terapiya-i-lechenie-kariesa",
    title: "Болит зуб",
    description: "Терапия и лечение кариеса",
  },
  {
    href: "/services/detskaya-stomatologiya",
    title: "Нужен детский приём",
    description: "Бережный осмотр и спокойная адаптация",
  },
  {
    href: "/services/implantatsiya-i-protezirovanie",
    title: "Нужно восстановление зуба",
    description: "Имплантация и протезирование",
  },
];

export default async function HeroSection() {
  const [section, settings] = await Promise.all([
    getSectionByType("hero"),
    getSiteSettings(),
  ]);

  if (!section?.enabled) return null;

  const content = parseSectionContent(section.content, fallbackContent);

  return (
    <section id="hero" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-20 -top-20 h-[420px] w-[420px] rounded-full bg-[rgba(201,176,113,0.14)] blur-[100px]" />
        <div className="absolute -right-16 top-8 h-[340px] w-[340px] rounded-full bg-[rgba(38,82,89,0.12)] blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[260px] w-[260px] rounded-full bg-[rgba(201,176,113,0.08)] blur-[80px]" />
      </div>

      <div className="site-container grid gap-10 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-20">
        <div className="space-y-8">
          <div className="space-y-6 animate-in">
            <span className="inline-flex rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">
              {content.eyebrow}
            </span>
            <div className="space-y-5">
              <h1 className="max-w-[540px] font-display text-[2rem] leading-[1.1] text-[var(--ink-strong)] sm:text-[2.5rem] md:text-[3rem] xl:text-[3.25rem]">
                {content.title}
                <span className="mt-2 block bg-gradient-to-r from-[var(--accent)] to-[#d4b06a] bg-clip-text text-transparent">
                  {content.accent}
                </span>
              </h1>
              <p className="max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
                {content.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 animate-in delay-2 sm:flex-row sm:gap-4">
            <PhoneLink
              phone={settings.phone}
              rawPhone={settings.phoneRaw}
              label={content.primaryLabel}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ink-strong)] px-7 py-4 text-base font-semibold text-white shadow-[0_8px_30px_rgba(16,46,53,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(16,46,53,0.36)]"
            />
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white/60 px-7 py-4 text-base font-semibold text-[var(--ink-strong)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[var(--shadow-soft)]"
            >
              {content.secondaryLabel}
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 4v12m0 0-4-4m4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <p className="animate-fade text-sm leading-6 text-[var(--muted)]">
            Расскажите по телефону, что беспокоит, и мы подберём врача, формат
            приёма и удобное время без лишних шагов.
          </p>

          <div className="grid gap-3 animate-in delay-3 md:grid-cols-3">
            {heroScenarios.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="surface-card group rounded-[1.6rem] px-4 py-4"
              >
                <p className="text-sm font-semibold text-[var(--ink-strong)] transition-colors group-hover:text-[var(--accent)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>

          {content.badges.length > 0 ? (
            <div className="flex flex-wrap gap-2.5 animate-in delay-4">
              {content.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-[var(--line)] bg-white/60 px-4 py-2 text-sm font-medium text-[var(--ink)] backdrop-blur-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}

          {content.trustItems.length > 0 ? (
            <div className="grid gap-3 animate-in delay-5 sm:grid-cols-3">
              {content.trustItems.map((item) => (
                <div
                  key={item.label}
                  className="surface-card rounded-2xl px-5 py-5"
                >
                  <div className="font-display text-3xl leading-none text-[var(--ink-strong)] sm:text-4xl">
                    {item.value}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative animate-scale delay-2">
          <div className="absolute -left-8 top-12 hidden h-40 w-40 rounded-full bg-[rgba(201,176,113,0.20)] blur-[60px] lg:block" />
          <div className="absolute -bottom-10 -right-4 hidden h-48 w-48 rounded-full bg-[rgba(38,82,89,0.14)] blur-[60px] lg:block" />

          <div className="surface-card relative overflow-hidden rounded-[2.5rem] p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
              <Image
                src={content.imagePath}
                alt="Интерьер клиники Рамзи Дент"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 48vw"
                priority
                unoptimized={isUploadedMediaPath(content.imagePath)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,46,53,0.4)] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

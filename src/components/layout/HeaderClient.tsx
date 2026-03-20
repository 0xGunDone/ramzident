"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoIcon from "@/components/ui/LogoIcon";
import PhoneLink from "@/components/ui/PhoneLink";

interface HeaderClientProps {
  clinicName: string;
  phone: string;
  rawPhone: string;
  hasDocuments: boolean;
}

const baseNavigation = [
  { href: "/#about", label: "О клинике" },
  { href: "/#services", label: "Услуги" },
  { href: "/#doctors", label: "Врачи" },
  { href: "/#gallery", label: "Клиника" },
  { href: "/#contacts", label: "Контакты" },
];

export default function HeaderClient({
  clinicName,
  phone,
  rawPhone,
  hasDocuments,
}: HeaderClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navigation = hasDocuments
    ? [...baseNavigation.slice(0, 4), { href: "/documents", label: "Документы" }, baseNavigation[4]]
    : baseNavigation;

  const mobileSecondaryAction = pathname.startsWith("/services/")
    ? { href: "/services", label: "Все услуги" }
    : pathname === "/"
      ? { href: "/#services", label: "Услуги" }
      : { href: "/#contacts", label: "Контакты" };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/40 bg-[color:rgba(247,241,230,0.78)] backdrop-blur-xl">
        <div className="site-container">
          <div className="flex min-h-[82px] items-center justify-between gap-6">
            <Link
              href="/"
              className="flex items-center gap-4 text-[var(--ink-strong)]"
              onClick={() => setIsOpen(false)}
            >
              <span className="grid h-14 w-14 place-items-center rounded-[1.2rem] border border-[var(--line)] bg-white/85 p-2.5 shadow-[var(--shadow-soft)]">
                <LogoIcon />
              </span>
              <span className="flex flex-col">
                <span className="font-display text-3xl leading-none tracking-tight">
                  {clinicName}
                </span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--accent)]">
                  стоматологическая клиника
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-7 xl:flex">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-semibold text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <PhoneLink
                phone={phone}
                rawPhone={rawPhone}
                className="text-sm font-semibold text-[var(--ink)] transition-colors hover:text-[var(--accent)]"
              />
              <PhoneLink
                phone={phone}
                rawPhone={rawPhone}
                label="Позвонить"
                className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[var(--ink)]"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-white/85 text-[var(--ink-strong)] shadow-[var(--shadow-soft)] xl:hidden"
              onClick={() => setIsOpen((current) => !current)}
              aria-expanded={isOpen}
              aria-label="Открыть меню"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor">
                <path
                  d={isOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                />
              </svg>
            </button>
          </div>
        </div>

        {isOpen ? (
          <div className="border-t border-white/40 bg-[color:rgba(255,250,242,0.94)] xl:hidden">
            <div className="site-container flex flex-col gap-4 py-5">
              <nav className="flex flex-col gap-3">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border border-[var(--line)] bg-white/75 px-4 py-3 text-sm font-semibold text-[var(--ink)] shadow-[var(--shadow-soft)]"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <PhoneLink
                phone={phone}
                rawPhone={rawPhone}
                label={`Позвонить: ${phone}`}
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--ink-strong)] px-4 py-3 text-sm font-semibold text-white"
              />
            </div>
          </div>
        ) : null}
      </header>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <div className="pointer-events-auto mx-auto flex w-full max-w-xl items-center gap-3 rounded-[1.8rem] border border-white/55 bg-[color:rgba(255,250,242,0.92)] p-3 shadow-[0_22px_60px_rgba(20,43,49,0.18)] backdrop-blur-xl">
          <Link
            href={mobileSecondaryAction.href}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-[1.2rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink-strong)]"
          >
            {mobileSecondaryAction.label}
          </Link>
          <PhoneLink
            phone={phone}
            rawPhone={rawPhone}
            label="Позвонить"
            className="inline-flex min-h-12 flex-[1.25] items-center justify-center rounded-[1.2rem] bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(16,46,53,0.22)]"
          />
        </div>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Дашборд", href: "/admin/dashboard" },
  { name: "Секции", href: "/admin/sections" },
  { name: "Услуги", href: "/admin/services" },
  { name: "Врачи", href: "/admin/doctors" },
  { name: "Отзывы", href: "/admin/testimonials" },
  { name: "FAQ", href: "/admin/faq" },
  { name: "Медиа", href: "/admin/media" },
  { name: "Документы", href: "/admin/documents" },
  { name: "Настройки", href: "/admin/settings" },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarPanel({
  pathname,
  onNavigate,
  showCloseButton = false,
}: {
  pathname: string;
  onNavigate: () => void;
  showCloseButton?: boolean;
}) {
  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-slate-950 text-white">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/70">
            Ramzi Dent CMS
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Панель управления</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Контент, услуги, врачи, документы и SEO в одном месте.
          </p>
        </div>

        {showCloseButton ? (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Закрыть меню навигации"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M6 6l12 12M18 6L6 18"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-4">
        {navigation.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={() => {
            onNavigate();
            signOut({ callbackUrl: "/admin/login" });
          }}
          aria-label="Выйти из панели управления"
          className="flex w-full items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-4 backdrop-blur lg:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Ramzi Dent CMS
          </p>
          <p className="text-lg font-semibold text-slate-900">Панель управления</p>
        </div>
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls="admin-mobile-navigation"
          aria-label={isOpen ? "Закрыть меню навигации" : "Открыть меню навигации"}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor">
            <path
              d={isOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>
      </div>

      <aside className="hidden lg:block lg:w-72 lg:shrink-0">
        <div className="sticky top-0 h-screen">
          <SidebarPanel pathname={pathname} onNavigate={() => {}} />
        </div>
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-slate-950/45 transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          id="admin-mobile-navigation"
          className={`absolute inset-y-0 left-0 w-[min(88vw,22rem)] transition-transform duration-200 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarPanel
            pathname={pathname}
            onNavigate={() => setIsOpen(false)}
            showCloseButton
          />
        </aside>
      </div>
    </>
  );
}

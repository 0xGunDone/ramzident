"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
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

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/5 bg-white/90 px-4 py-4 backdrop-blur md:hidden">
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
          aria-label="Открыть меню навигации"
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

      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-xs flex-col border-r border-white/10 bg-slate-950 text-white transition-transform md:static md:w-72 md:max-w-none md:translate-x-0`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/70">
            Ramzi Dent CMS
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Панель управления</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Контент, услуги, врачи, документы и SEO в одном месте.
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
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
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            aria-label="Выйти из панели управления"
            className="flex w-full items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Выйти
          </button>
        </div>
      </aside>

      {isOpen ? (
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      ) : null}
    </>
  );
}

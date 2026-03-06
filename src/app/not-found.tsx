import type { Metadata } from "next";
import Link from "next/link";

import { createSocialMetadata } from "@/lib/metadata";
import { getNotFoundStaticOgPath } from "@/lib/og-paths";

export const metadata: Metadata = {
  ...createSocialMetadata({
    title: "Страница не найдена",
    description:
      "Страница отсутствует или была перенесена. Перейдите на главную страницу клиники Рамзи Дент.",
    imageAlt: "404 Рамзи Дент",
    ogPath: getNotFoundStaticOgPath(),
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="surface-card max-w-xl rounded-[2.2rem] px-8 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          404
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none text-[var(--ink-strong)]">
          Страница не найдена
        </h1>
        <p className="mt-5 text-base leading-8 text-[var(--muted)]">
          Возможно, ссылка устарела или страница была перемещена.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--ink-strong)] px-6 py-3 text-sm font-semibold text-white"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [services, doctors, media, documents, testimonials, faqItems] =
    await Promise.all([
      prisma.service.count(),
      prisma.doctor.count(),
      prisma.media.count(),
      prisma.siteDocument.count(),
      prisma.testimonial.count(),
      prisma.faqItem.count(),
    ]);

  const cards = [
    { label: "Услуги", value: services },
    { label: "Врачи", value: doctors },
    { label: "Медиафайлы", value: media },
    { label: "Документы", value: documents },
    { label: "Отзывы", value: testimonials },
    { label: "FAQ", value: faqItems },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Ramzi Dent CMS
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Дашборд</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Панель уже ориентирована на прод: реальные услуги, страницы, документы,
          привязка медиа и контентные секции. Заполнение и публикация управляются
          из левого меню.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[1.8rem] border border-black/5 bg-white px-6 py-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {card.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{card.value}</p>
          </div>
        ))}
      </div>

      {/* <div className="rounded-[2rem] border border-black/5 bg-white px-6 py-6 shadow-sm"> */}
        {/* <h2 className="text-xl font-semibold text-slate-950">Что уже подготовлено</h2> */}
        {/* <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600"> */}
          {/* <li>Отдельные страницы услуг для SEO и прямого звонка.</li> */}
          {/* <li>Документный раздел под политику, оферту и лицензии.</li> */}
          {/* <li>Карта Яндекса с кастомным пином на основе логотипа клиники.</li> */}
          {/* <li>Явное назначение медиа по usage вместо случайной галереи.</li> */}
          {/* <li>Обновлённая визуальная система для публичной части.</li> */}
        {/* </ul> */}
      {/* </div> */}
    </div>
  );
}

import SectionHeading from "@/components/ui/SectionHeading";
import PhoneLink from "@/components/ui/PhoneLink";
import YandexClinicMap from "@/components/maps/YandexClinicMap";
import { getSectionByType, getSiteSettings, parseSectionContent } from "@/lib/site";

interface ContactsContent {
  description: string;
}

const fallbackContent: ContactsContent = {
  description: "Свяжитесь с клиникой напрямую по телефону.",
};

export default async function ContactsSection() {
  const [section, settings] = await Promise.all([
    getSectionByType("contacts"),
    getSiteSettings(),
  ]);

  if (!section?.enabled) return null;
  const content = parseSectionContent(section.content, fallbackContent);

  return (
    <section id="contacts" className="section-space">
      <div className="site-container grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:gap-14">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Контакты"
            title={section.title || "Позвоните в клинику напрямую"}
            description={content.description}
          />

          <div className="grid gap-4">
            <div className="surface-card rounded-[2rem] px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Телефон
              </p>
              <PhoneLink
                phone={settings.phone}
                rawPhone={settings.phoneRaw}
                className="mt-3 inline-flex text-3xl font-semibold text-[var(--ink-strong)]"
              />
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Запись и уточнение деталей только по телефону. Формы на сайте не
                используются.
              </p>
            </div>

            <div className="surface-card rounded-[2rem] px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Адрес
              </p>
              <p className="mt-3 text-lg leading-8 text-[var(--ink-strong)]">
                {settings.address}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Входная группа и фотографии клиники дополнительно подтверждаются
                по Яндекс Картам.
              </p>
            </div>

            <div className="surface-card rounded-[2rem] px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Режим работы
              </p>
              <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--ink)]">
                <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--line)] bg-white/75 px-4 py-2">
                  <span>Пн-Пт</span>
                  <span className="font-semibold">{settings.workHoursWeekdays}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--line)] bg-white/75 px-4 py-2">
                  <span>Сб-Вс</span>
                  <span className="font-semibold">{settings.workHoursWeekend}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <YandexClinicMap
          title={settings.clinicName}
          address={settings.address}
          center={[settings.mapCenterLat, settings.mapCenterLng]}
          pin={[settings.mapPinLat, settings.mapPinLng]}
          zoom={settings.mapZoom}
        />
      </div>
    </section>
  );
}

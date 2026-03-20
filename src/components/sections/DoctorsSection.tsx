import Image from "next/image";
import type { Prisma } from "@prisma/client";
import PhoneLink from "@/components/ui/PhoneLink";
import SectionHeading from "@/components/ui/SectionHeading";
import { getDoctorProfile } from "@/lib/doctor-profiles";
import { isUploadedMediaPath } from "@/lib/images";
import { getSectionByType, getSiteSettings, parseSectionContent } from "@/lib/site";
import { prisma } from "@/lib/prisma";

interface DoctorsSectionContent {
  description: string;
}

const fallbackContent: DoctorsSectionContent = {
  description: "Команда клиники для взрослых и детей.",
};

const DELAYS = ["", "delay-1", "delay-2", "delay-3", "delay-4", "delay-5", "delay-6"];
type SectionDoctorItem = Prisma.DoctorGetPayload<{
  include: { photo: true };
}>;

export default async function DoctorsSection() {
  const [section, doctors, settings] = await Promise.all([
    getSectionByType("doctors"),
    prisma.doctor.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
      include: { photo: true },
    }) as Promise<SectionDoctorItem[]>,
    getSiteSettings(),
  ]);

  if (!section?.enabled) return null;
  const content = parseSectionContent(section.content, fallbackContent);

  return (
    <section id="doctors" className="section-space">
      <div className="site-container space-y-10">
        <SectionHeading
          eyebrow="Врачи"
          title={section.title || "Команда клиники"}
          description={content.description}
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor: SectionDoctorItem, i: number) => {
            const profile = getDoctorProfile(doctor.slug);

            return (
              <article
                key={doctor.id}
                className={`surface-card flex flex-col overflow-hidden rounded-[2rem] animate-in ${DELAYS[Math.min(i + 1, 6)]}`}
              >
              <div className="relative aspect-[3/4] overflow-hidden">
                {doctor.photo ? (
                  <Image
                    src={doctor.photo.path}
                    alt={doctor.photo.altText || doctor.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={isUploadedMediaPath(doctor.photo.path)}
                  />
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(180deg,rgba(23,60,67,0.12),rgba(23,60,67,0.24))]" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(15,44,51,0.82)] via-[rgba(15,44,51,0.3)] to-transparent px-6 pb-6 pt-20 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-soft)]">
                    {doctor.experience ? `Стаж ${doctor.experience}` : "Команда клиники"}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">{doctor.name}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-white/75">
                    {doctor.speciality}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                {profile ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.focusAreas.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
                {doctor.bio ? (
                  <p className="text-sm leading-7 text-[var(--muted)]">
                    {doctor.bio}
                  </p>
                ) : null}
                <div className="grid gap-3">
                  {profile?.bestFor ? (
                    <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/80 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                        Подойдёт, если
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--ink)]">
                        {profile.bestFor}
                      </p>
                    </div>
                  ) : null}
                  {(profile?.careStyle || doctor.education) ? (
                    <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/80 px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                        Формат приёма
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--ink)]">
                        {profile?.careStyle || doctor.education}
                      </p>
                    </div>
                  ) : null}
                </div>
                <div className="mt-auto flex flex-col gap-3 pt-1">
                  {doctor.schedule ? (
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                      {doctor.schedule}
                    </p>
                  ) : null}
                  <PhoneLink
                    phone={settings.phone}
                    rawPhone={settings.phoneRaw}
                    label={`Записаться: ${settings.phone}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--ink-strong)] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--ink)]"
                  />
                </div>
              </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

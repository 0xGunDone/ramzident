import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { getSectionByType, parseSectionContent } from "@/lib/site";
import { prisma } from "@/lib/prisma";

interface DoctorsSectionContent {
  description: string;
}

const fallbackContent: DoctorsSectionContent = {
  description: "Команда клиники для взрослых и детей.",
};

const DELAYS = ["", "delay-1", "delay-2", "delay-3", "delay-4", "delay-5", "delay-6"];

export default async function DoctorsSection() {
  const [section, doctors] = await Promise.all([
    getSectionByType("doctors"),
    prisma.doctor.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
      include: { photo: true },
    }),
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
          {doctors.map((doctor, i) => (
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
                {doctor.bio ? (
                  <p className="line-clamp-4 text-sm leading-7 text-[var(--muted)]">
                    {doctor.bio}
                  </p>
                ) : null}
                {doctor.education ? (
                  <div className="rounded-xl border border-[var(--line)] bg-white/80 px-4 py-3.5 text-sm leading-7 text-[var(--ink)]">
                    {doctor.education}
                  </div>
                ) : null}
                {doctor.schedule ? (
                  <p className="mt-auto text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
                    {doctor.schedule}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

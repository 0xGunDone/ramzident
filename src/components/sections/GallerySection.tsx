import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { isUploadedMediaPath } from "@/lib/images";
import { getSectionByType, parseSectionContent } from "@/lib/site";
import { prisma } from "@/lib/prisma";

interface GallerySectionContent {
  description: string;
}

const fallbackContent: GallerySectionContent = {
  description: "Реальные фотографии клиники.",
};

export default async function GallerySection() {
  const [section, images] = await Promise.all([
    getSectionByType("gallery"),
    prisma.media.findMany({
      where: {
        usage: "gallery",
        mimeType: { startsWith: "image/" },
      },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
  ]);

  if (!section?.enabled || images.length === 0) return null;

  const content = parseSectionContent(section.content, fallbackContent);

  return (
    <section id="gallery" className="section-space">
      <div className="site-container space-y-10">
        <SectionHeading
          eyebrow="Пространство клиники"
          title={section.title || "Реальные фотографии без стока"}
          description={content.description}
          align="center"
        />

        <div className="grid auto-rows-[220px] gap-4 md:grid-cols-3 lg:auto-rows-[260px]">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`surface-card relative overflow-hidden rounded-[2rem] ${
                index === 0 ? "md:col-span-2 md:row-span-2" : ""
              }`}
            >
              <Image
                src={image.path}
                alt={image.altText || image.label || `Фото клиники ${index + 1}`}
                fill
                className="object-cover"
                unoptimized={isUploadedMediaPath(image.path)}
                sizes={
                  index === 0
                    ? "(max-width: 768px) 100vw, 66vw"
                    : "(max-width: 768px) 100vw, 33vw"
                }
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(15,44,51,0.76)] to-transparent px-5 pb-5 pt-12">
                <p className="text-sm font-medium text-white/85">
                  {image.label || "Рамзи Дент"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

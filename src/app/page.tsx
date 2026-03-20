import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HashScrollHandler from "@/components/ui/HashScrollHandler";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import ServicesSection from "@/components/sections/ServicesSection";
import DoctorsSection from "@/components/sections/DoctorsSection";
import GallerySection from "@/components/sections/GallerySection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FAQSection from "@/components/sections/FAQSection";
import DocumentsSection from "@/components/sections/DocumentsSection";
import ContactsSection from "@/components/sections/ContactsSection";
import type { Section } from "@prisma/client";
import { getSections } from "@/lib/site";

type SectionRenderer = () => Promise<React.ReactNode>;
type HomeSection = Pick<Section, "id" | "type">;
type RenderedSection = { id: string; node: React.ReactNode };

const sectionRenderers: Record<string, SectionRenderer> = {
  hero: HeroSection,
  about: AboutSection,
  services: ServicesSection,
  doctors: DoctorsSection,
  gallery: GallerySection,
  testimonials: TestimonialsSection,
  faq: FAQSection,
  documents: DocumentsSection,
  contacts: ContactsSection,
};

export default async function Home() {
  const sections = (await getSections()) as HomeSection[];

  const renderedSections: RenderedSection[] = await Promise.all(
    sections.map(async (section: HomeSection): Promise<RenderedSection> => {
      const render = sectionRenderers[section.type];

      return {
        id: section.id,
        node: render ? await render() : null,
      };
    })
  );

  return (
    <div className="min-h-screen">
      <HashScrollHandler />
      <Header />
      <main>
        {renderedSections.map((section: RenderedSection) => (
          <div key={section.id}>{section.node}</div>
        ))}
      </main>
      <Footer />
    </div>
  );
}

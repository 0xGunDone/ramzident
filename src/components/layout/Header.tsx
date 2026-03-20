import HeaderClient from "@/components/layout/HeaderClient";
import { hasPublishedDocuments } from "@/lib/data";
import { getSiteSettings } from "@/lib/site";

export default async function Header() {
  const [settings, hasDocuments] = await Promise.all([
    getSiteSettings(),
    hasPublishedDocuments(),
  ]);

  return (
    <HeaderClient
      clinicName={settings.clinicName}
      phone={settings.phone}
      rawPhone={settings.phoneRaw}
      hasDocuments={hasDocuments}
    />
  );
}

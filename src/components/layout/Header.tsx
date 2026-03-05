import HeaderClient from "@/components/layout/HeaderClient";
import { getSiteSettings } from "@/lib/site";

export default async function Header() {
  const settings = await getSiteSettings();

  return (
    <HeaderClient
      clinicName={settings.clinicName}
      phone={settings.phone}
      rawPhone={settings.phoneRaw}
    />
  );
}

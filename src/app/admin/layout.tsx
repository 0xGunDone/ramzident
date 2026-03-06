import type { Metadata } from "next";
import { Providers } from "@/components/Providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Админка",
    template: "%s | Админка",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex min-h-screen bg-gray-100">
        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </Providers>
  );
}

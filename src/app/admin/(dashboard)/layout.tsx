import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}

import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <AdminSidebar />
      <main className="min-w-0 flex-1 px-4 py-6 pb-10 md:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}

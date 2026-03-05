import { Providers } from "@/components/Providers";

export const dynamic = "force-dynamic";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Providers>
            <div className="flex bg-gray-100 min-h-screen">
                <div className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </div>
            </div>
        </Providers>
    );
}

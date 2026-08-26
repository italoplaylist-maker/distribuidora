import { requireSuperAdmin } from "@/lib/tenant/tenant-context";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminMobileHeader } from "@/components/layout/admin-mobile-header";
import { AdminBottomNav } from "@/components/layout/admin-bottom-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();

  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      <AdminSidebar adminName={admin.name ?? "Admin"} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminMobileHeader />
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 pb-24 sm:p-6 lg:pb-8">{children}</main>
      </div>
      <AdminBottomNav />
    </div>
  );
}

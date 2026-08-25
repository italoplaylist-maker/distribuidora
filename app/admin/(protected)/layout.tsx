import { requireSuperAdmin } from "@/lib/tenant/tenant-context";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();

  return (
    <div className="flex min-h-screen bg-[#0B0D0F] text-zinc-100">
      <AdminSidebar adminName={admin.name ?? "Admin"} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

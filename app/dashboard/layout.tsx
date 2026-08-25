import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { roleHasPermission } from "@/lib/permissions/permissions";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { TrialBanner } from "@/components/layout/trial-banner";
import { SIDEBAR_NAV, BOTTOM_NAV, MORE_NAV } from "@/components/layout/nav-config";
import { OfflineSyncBanner } from "@/features/sales/offline-sync-banner";

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  GERENTE: "Gerente",
  VENDEDOR: "Vendedor",
  ESTOQUISTA: "Estoquista",
  FINANCEIRO: "Financeiro",
  MOTORISTA: "Motorista",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant();

  const filterByPermission = (items: typeof SIDEBAR_NAV) =>
    items.filter((item) => !item.permission || roleHasPermission(tenant.role, item.permission));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={filterByPermission(SIDEBAR_NAV)} companyName={tenant.company.nomeFantasia} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TrialBanner status={tenant.company.status} trialEndsAt={tenant.company.trialEndsAt} />
        <OfflineSyncBanner />
        <Header userName={tenant.userName} roleLabel={tenant.role ? ROLE_LABELS[tenant.role] : ""} />
        <main className="flex-1 p-4 pb-24 lg:pb-6">{children}</main>
      </div>
      <BottomNav items={filterByPermission(BOTTOM_NAV)} moreItems={filterByPermission(MORE_NAV)} />
    </div>
  );
}

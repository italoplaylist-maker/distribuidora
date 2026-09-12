import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { roleHasPermission } from "@/lib/permissions/permissions";
import { ROLE_LABELS } from "@/lib/status";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { TrialBanner } from "@/components/layout/trial-banner";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { SIDEBAR_MAIN_NAV, SIDEBAR_SETTINGS_NAV, BOTTOM_NAV, MORE_NAV, type NavItem } from "@/components/layout/nav-config";
import { OfflineSyncBanner } from "@/features/sales/offline-sync-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant();

  const filterByPermission = (items: NavItem[]) =>
    items.filter((item) => !item.permission || roleHasPermission(tenant.role, item.permission));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        mainItems={filterByPermission(SIDEBAR_MAIN_NAV)}
        settingsItems={SIDEBAR_SETTINGS_NAV}
        companyName={tenant.company.nomeFantasia}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {tenant.impersonatedBy && <ImpersonationBanner adminName={tenant.impersonatedBy.adminName} companyName={tenant.company.nomeFantasia} />}
        <TrialBanner status={tenant.company.status} trialEndsAt={tenant.company.trialEndsAt} />
        <OfflineSyncBanner />
        <Header userName={tenant.userName} roleLabel={tenant.role ? ROLE_LABELS[tenant.role] : ""} />
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 pb-24 sm:p-6 lg:pb-8">{children}</main>
      </div>
      <BottomNav items={filterByPermission(BOTTOM_NAV)} moreItems={filterByPermission(MORE_NAV)} />
    </div>
  );
}

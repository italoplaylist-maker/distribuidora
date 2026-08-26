import { getAdminDashboardMetrics } from "@/features/admin/queries";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Building2, Users, CreditCard, TrendingUp, Package, Receipt, CheckCircle2, Hourglass, Ban, XCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  const m = await getAdminDashboardMetrics();

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard da plataforma" description="Visão geral do SaaS" />

      <Section title="Financeiro SaaS">
        <MetricCard index={0} label="MRR" value={formatCurrency(m.mrr)} icon={<TrendingUp />} accent="primary" />
        <MetricCard index={1} label="ARR" value={formatCurrency(m.arr)} icon={<TrendingUp />} accent="primary" />
        <MetricCard index={2} label="Ticket médio (ARPU)" value={formatCurrency(m.arpu)} icon={<CreditCard />} accent="primary" />
      </Section>

      <Section title="Empresas">
        <MetricCard index={0} label="Total de empresas" value={String(m.totalCompanies)} icon={<Building2 />} accent="neutral" />
        <MetricCard index={1} label="Ativas" value={String(m.activeCompanies)} icon={<CheckCircle2 />} accent="success" />
        <MetricCard index={2} label="Em trial" value={String(m.trialCompanies)} icon={<Hourglass />} accent="warning" />
        <MetricCard index={3} label="Suspensas" value={String(m.suspendedCompanies)} icon={<Ban />} accent="destructive" />
        <MetricCard index={4} label="Canceladas" value={String(m.canceledCompanies)} icon={<XCircle />} accent="neutral" />
      </Section>

      <Section title="Assinaturas">
        <MetricCard index={0} label="Assinaturas ativas" value={String(m.activeSubscriptions)} icon={<CreditCard />} accent="success" />
        <MetricCard index={1} label="Trials" value={String(m.trialingSubscriptions)} icon={<Hourglass />} accent="warning" />
        <MetricCard index={2} label="Canceladas" value={String(m.canceledSubscriptions)} icon={<XCircle />} accent="neutral" />
        <MetricCard index={3} label="Inadimplentes" value={String(m.pastDueSubscriptions)} icon={<Ban />} accent="destructive" />
      </Section>

      <Section title="Sistema">
        <MetricCard index={0} label="Usuários" value={`${m.activeUsers} / ${m.totalUsers}`} icon={<Users />} accent="neutral" />
        <MetricCard index={1} label="Produtos cadastrados" value={String(m.totalProducts)} icon={<Package />} accent="neutral" />
        <MetricCard index={2} label="Vendas realizadas" value={String(m.totalSales)} icon={<Receipt />} accent="neutral" />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{children}</div>
    </div>
  );
}

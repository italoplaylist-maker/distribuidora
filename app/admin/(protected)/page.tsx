import { getAdminDashboardMetrics } from "@/features/admin/queries";
import { formatCurrency } from "@/lib/utils";
import { Building2, Users, CreditCard, TrendingUp, Package, Receipt } from "lucide-react";

export default async function AdminDashboardPage() {
  const m = await getAdminDashboardMetrics();

  const companyCards = [
    { label: "Total de empresas", value: m.totalCompanies },
    { label: "Ativas", value: m.activeCompanies },
    { label: "Em trial", value: m.trialCompanies },
    { label: "Suspensas", value: m.suspendedCompanies },
    { label: "Canceladas", value: m.canceledCompanies },
  ];

  const subscriptionCards = [
    { label: "Assinaturas ativas", value: m.activeSubscriptions },
    { label: "Trials", value: m.trialingSubscriptions },
    { label: "Canceladas", value: m.canceledSubscriptions },
    { label: "Inadimplentes", value: m.pastDueSubscriptions },
  ];

  const financialCards = [
    { label: "MRR", value: formatCurrency(m.mrr), icon: TrendingUp },
    { label: "ARR", value: formatCurrency(m.arr), icon: TrendingUp },
    { label: "Ticket médio (ARPU)", value: formatCurrency(m.arpu), icon: CreditCard },
  ];

  const systemCards = [
    { label: "Usuários", value: `${m.activeUsers} / ${m.totalUsers}`, icon: Users },
    { label: "Produtos cadastrados", value: m.totalProducts, icon: Package },
    { label: "Vendas realizadas", value: m.totalSales, icon: Receipt },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard da plataforma</h1>
        <p className="text-sm text-zinc-500">Visão geral do SaaS</p>
      </div>

      <Section title="Empresas" icon={Building2}>
        {companyCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} />
        ))}
      </Section>

      <Section title="Assinaturas" icon={CreditCard}>
        {subscriptionCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} />
        ))}
      </Section>

      <Section title="Financeiro SaaS" icon={TrendingUp}>
        {financialCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} />
        ))}
      </Section>

      <Section title="Sistema" icon={Package}>
        {systemCards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
        <Icon className="size-4" /> {title}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{children}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

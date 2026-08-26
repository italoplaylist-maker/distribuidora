import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getFinanceSummary, getOpenCashRegister } from "@/features/finance/queries";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { formatCurrency } from "@/lib/utils";

export default async function FinancePage() {
  const tenant = await getCurrentTenant();
  const [summary, cashRegister] = await Promise.all([getFinanceSummary(tenant.companyId), getOpenCashRegister(tenant.companyId)]);

  return (
    <div className="space-y-5">
      <PageHeader title="Financeiro" description="Contas, recebimentos e caixa da empresa" />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          index={0}
          href="/dashboard/finance/receivables"
          label="Contas a receber"
          value={formatCurrency(summary.receivablesOpen)}
          icon={<ArrowDownCircle />}
          accent="success"
        />
        <MetricCard
          index={1}
          href="/dashboard/finance/payables"
          label="Contas a pagar"
          value={formatCurrency(summary.payablesOpen)}
          icon={<ArrowUpCircle />}
          accent="warning"
        />
        <MetricCard
          index={2}
          href="/dashboard/finance/cash"
          label="Caixa"
          value={cashRegister ? formatCurrency(cashRegister.expectedBalance.toString()) : "Fechado"}
          hint={cashRegister ? "Aberto agora" : "Nenhum caixa aberto"}
          icon={<Wallet />}
          accent={cashRegister ? "primary" : "neutral"}
        />
      </div>
    </div>
  );
}

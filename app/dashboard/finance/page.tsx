import { ArrowDownCircle, ArrowUpCircle, Wallet, Scale, LineChart } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getFinanceSummary, getOpenCashRegister, getLiquiditySummary } from "@/features/finance/queries";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { formatCurrency } from "@/lib/utils";

export default async function FinancePage() {
  const tenant = await getCurrentTenant();
  const [summary, cashRegister, liquidity] = await Promise.all([
    getFinanceSummary(tenant.companyId),
    getOpenCashRegister(tenant.companyId),
    getLiquiditySummary(tenant.companyId),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Financeiro" description="Contas, recebimentos, caixa e liquidez da empresa" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <MetricCard
          index={3}
          href="/dashboard/finance/liquidity"
          label="Saldo projetado"
          value={formatCurrency(liquidity.saldoProjetado)}
          hint="Liquidez da empresa"
          icon={<Scale />}
          accent={liquidity.saldoProjetado >= 0 ? "success" : "destructive"}
        />
        <MetricCard
          index={4}
          href="/dashboard/finance/cash-flow"
          label="Fluxo de caixa"
          value="Ver detalhes"
          hint="Entradas e saídas por período"
          icon={<LineChart />}
          accent="neutral"
        />
      </div>
    </div>
  );
}

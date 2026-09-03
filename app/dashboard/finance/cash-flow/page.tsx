import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getCashFlow } from "@/features/finance/queries";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { CASH_MOVEMENT_LABELS } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";
import { CashFlowChartCard } from "@/features/finance/cash-flow-chart-card";

export default async function CashFlowPage() {
  const tenant = await getCurrentTenant();

  const [d7, d30, d90] = await Promise.all([
    getCashFlow(tenant.companyId, "7d"),
    getCashFlow(tenant.companyId, "30d"),
    getCashFlow(tenant.companyId, "90d"),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Fluxo de caixa" description="Entradas e saídas reais de dinheiro, dia a dia" />

      <Card>
        <CardContent className="pt-6">
          <CashFlowChartCard data={{ "7d": d7, "30d": d30, "90d": d90 }} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-1 text-[14px] font-semibold">Por tipo de movimentação (últimos 30 dias)</p>
          <div className="divide-y divide-border/60">
            {d30.byType.length === 0 && <p className="py-4 text-[13.5px] text-muted-foreground">Nenhuma movimentação no período.</p>}
            {d30.byType.map((t) => (
              <div key={t.type} className="flex items-center justify-between py-2.5 text-[13.5px]">
                <span>{CASH_MOVEMENT_LABELS[t.type] ?? t.type}</span>
                <span className={`font-medium ${t.total >= 0 ? "text-success" : "text-destructive"}`}>
                  {t.total >= 0 ? "+" : ""}
                  {formatCurrency(t.total)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Wallet, ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getLiquiditySummary } from "@/features/finance/queries";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

function formatRatio(v: number | null) {
  if (v === null) return "—";
  return `${v.toFixed(2)}x`;
}

export default async function LiquidityPage() {
  const tenant = await getCurrentTenant();
  const l = await getLiquiditySummary(tenant.companyId);

  const atualHealthy = l.liquidezAtual === null || l.liquidezAtual >= 1;
  const projetadaHealthy = l.liquidezProjetada === null || l.liquidezProjetada >= 1;

  return (
    <div className="space-y-5">
      <PageHeader title="Liquidez" description="Sua capacidade real de honrar compromissos com o dinheiro disponível" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard index={0} label="Disponível agora" value={formatCurrency(l.disponivel)} icon={<Wallet />} accent="primary" hint="Caixa aberto" />
        <MetricCard index={1} label="A receber" value={formatCurrency(l.aReceber)} icon={<ArrowDownCircle />} accent="success" />
        <MetricCard index={2} label="A pagar" value={formatCurrency(l.aPagar)} icon={<ArrowUpCircle />} accent="warning" />
        <MetricCard
          index={3}
          label="Saldo projetado"
          value={formatCurrency(l.saldoProjetado)}
          icon={<Scale />}
          accent={l.saldoProjetado >= 0 ? "success" : "destructive"}
          hint="Disponível + a receber − a pagar"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className={atualHealthy ? "" : "border-destructive/40"}>
          <CardContent className="space-y-1 pt-6">
            <p className="text-[13px] text-muted-foreground">Liquidez atual</p>
            <p className={`text-[28px] font-semibold tracking-[-0.02em] ${atualHealthy ? "" : "text-destructive"}`}>{formatRatio(l.liquidezAtual)}</p>
            <p className="text-[12.5px] text-muted-foreground">
              {l.liquidezAtual === null
                ? "Sem contas a pagar em aberto."
                : atualHealthy
                  ? "Você tem dinheiro suficiente em caixa para cobrir suas contas a pagar."
                  : "O caixa disponível não cobre suas contas a pagar em aberto."}
            </p>
          </CardContent>
        </Card>
        <Card className={projetadaHealthy ? "" : "border-destructive/40"}>
          <CardContent className="space-y-1 pt-6">
            <p className="text-[13px] text-muted-foreground">Liquidez projetada</p>
            <p className={`text-[28px] font-semibold tracking-[-0.02em] ${projetadaHealthy ? "" : "text-destructive"}`}>{formatRatio(l.liquidezProjetada)}</p>
            <p className="text-[12.5px] text-muted-foreground">
              {l.liquidezProjetada === null
                ? "Sem contas a pagar em aberto."
                : projetadaHealthy
                  ? "Somando o que você tem a receber, dá para cobrir tudo que deve."
                  : "Mesmo recebendo tudo que está em aberto, ainda faltaria dinheiro."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 text-[14px] font-semibold">Compromissos por prazo</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-[12px] text-muted-foreground">A receber em 7 dias</p>
              <p className="text-[16px] font-semibold text-success">{formatCurrency(l.proximos7.aReceber)}</p>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">A pagar em 7 dias</p>
              <p className="text-[16px] font-semibold text-warning">{formatCurrency(l.proximos7.aPagar)}</p>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">A receber em 30 dias</p>
              <p className="text-[16px] font-semibold text-success">{formatCurrency(l.proximos30.aReceber)}</p>
            </div>
            <div>
              <p className="text-[12px] text-muted-foreground">A pagar em 30 dias</p>
              <p className="text-[16px] font-semibold text-warning">{formatCurrency(l.proximos30.aPagar)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

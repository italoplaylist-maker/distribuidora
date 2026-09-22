import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getDashboardData } from "@/features/dashboard/queries";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/metric-card";
import { ActionCard } from "@/components/action-card";
import { RankingList } from "@/components/ranking-list";
import { ActivityTimeline, type ActivityItem } from "@/components/activity-timeline";
import { EmptyState } from "@/components/empty-state";
import { SalesChartCard } from "@/features/dashboard/sales-chart-card";
import { AlertsCard } from "@/components/alerts-card";
import { InsightsCard } from "@/components/insights-card";
import { buildAlerts, buildInsights } from "@/features/dashboard/insights";
import { formatCurrency } from "@/lib/utils";
import { BRAZIL_TIMEZONE } from "@/lib/timezone";
import {
  Receipt,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  AlertTriangle,
  PlusCircle,
  PackagePlus,
  HandCoins,
  ShoppingBag,
  Boxes,
  ShoppingCart,
  Percent,
  Tag,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const tenant = await getCurrentTenant();
  const data = await getDashboardData(tenant.companyId);
  const firstName = tenant.userName.split(" ")[0];
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: BRAZIL_TIMEZONE });
  const alerts = buildAlerts(data);
  const insights = buildInsights(data);

  const quickActions = [
    { label: "Nova venda", hint: "PDV", href: "/dashboard/sales/new", icon: <PlusCircle /> },
    { label: "Entrada", hint: "Estoque", href: "/dashboard/purchases/new", icon: <PackagePlus /> },
    { label: "Receber", hint: "Financeiro", href: "/dashboard/finance/receivables", icon: <HandCoins /> },
    { label: "Nova compra", hint: "Fornecedor", href: "/dashboard/purchases/new", icon: <ShoppingBag /> },
    { label: "Produto", hint: "Cadastro", href: "/dashboard/products/new", icon: <Boxes /> },
    { label: "Caixa", hint: "Financeiro", href: "/dashboard/finance/cash", icon: <Wallet /> },
  ];

  const activity: ActivityItem[] = [
    ...data.recentSales.map((s) => ({
      id: `sale-${s.id}`,
      icon: Receipt,
      tone: "primary" as const,
      title: "Venda realizada",
      subtitle: s.customer?.name ?? "Consumidor final",
      amount: Number(s.totalAmount),
      time: s.createdAt,
    })),
    ...data.recentPurchases.map((p) => ({
      id: `purchase-${p.id}`,
      icon: ShoppingCart,
      tone: "neutral" as const,
      title: "Entrada de estoque",
      subtitle: p.supplier.name,
      amount: Number(p.totalAmount),
      amountTone: "negative" as const,
      time: p.createdAt,
    })),
    ...data.recentReceipts.map((r) => ({
      id: `receipt-${r.id}`,
      icon: HandCoins,
      tone: "success" as const,
      title: "Pagamento recebido",
      subtitle: r.description ?? "Recebimento",
      amount: Number(r.amount),
      time: r.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)
    .map((item) => ({ ...item, time: formatRelativeTime(item.time) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-[-0.015em] sm:text-[28px]">Olá, {firstName} 👋</h1>
        <p className="text-[13.5px] capitalize text-muted-foreground">{today}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          index={0}
          label="Vendas hoje"
          value={data.vendasHoje.toString()}
          icon={<Receipt />}
          hint={formatCurrency(data.faturamentoHoje)}
          trend={
            data.variacaoVendas !== null
              ? { value: `${Math.abs(data.variacaoVendas).toFixed(0)}%`, direction: data.variacaoVendas >= 0 ? "up" : "down" }
              : undefined
          }
        />
        <MetricCard
          index={1}
          label="Estoque"
          value={formatCurrency(data.estoqueValor)}
          icon={<Boxes />}
          accent="neutral"
          hint={`Potencial: ${formatCurrency(data.estoquePotencial)}`}
          href="/dashboard/products"
        />
        <MetricCard
          index={2}
          label="A receber"
          value={formatCurrency(data.contasReceber)}
          icon={<ArrowDownCircle />}
          accent="warning"
          hint={`${data.receivablesPendingCount} pendentes`}
          href="/dashboard/finance/receivables"
        />
        <MetricCard
          index={3}
          label="Caixa"
          value={data.saldoCaixa === null ? "Fechado" : formatCurrency(data.saldoCaixa)}
          icon={<Wallet />}
          accent={data.saldoCaixa === null ? "neutral" : "success"}
          hint={data.saldoCaixa === null ? "Abra o caixa para vender" : "Aberto"}
          href="/dashboard/finance/cash"
        />
      </div>

      <div>
        <p className="mb-3 px-0.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground/70">Ações rápidas</p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {quickActions.map((a) => (
            <ActionCard key={a.label} {...a} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 px-0.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground/70">Resultado dos últimos 30 dias</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard index={0} label="Faturamento" value={formatCurrency(data.faturamentoMes)} icon={<TrendingUp />} accent="primary" />
          <MetricCard
            index={1}
            label="Lucro bruto"
            value={formatCurrency(data.lucroMes)}
            icon={<Tag />}
            accent={data.lucroMes >= 0 ? "success" : "destructive"}
          />
          <MetricCard
            index={2}
            label="Margem média"
            value={data.margemMedia !== null ? `${data.margemMedia.toFixed(1)}%` : "—"}
            icon={<Percent />}
            accent="neutral"
          />
          <MetricCard index={3} label="Ticket médio" value={formatCurrency(data.ticketMedio)} icon={<Receipt />} accent="neutral" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 font-semibold tracking-[-0.01em]">Alertas</p>
          <AlertsCard alerts={alerts} />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Card>
            <CardContent className="pt-6">
              <SalesChartCard data={data.salesTrend} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-4 font-semibold tracking-[-0.01em]">Produtos mais vendidos</p>
              <RankingList items={data.topProducts} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 flex items-center gap-2 font-semibold tracking-[-0.01em]">
                <Sparkles className="size-4 text-primary" /> Insights
              </p>
              <InsightsCard insights={insights} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold tracking-[-0.01em]">Estoque baixo</p>
                {data.lowStockItems.length > 0 && (
                  <AlertTriangle className="size-4 text-warning" />
                )}
              </div>
              {data.lowStockItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhum produto com estoque baixo. 🎉</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {data.lowStockItems.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="shrink-0 font-medium text-warning">
                        {p.stock} {p.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <a
                href="/dashboard/products?filter=low-stock"
                className="mt-3 block text-center text-[13px] font-medium text-primary hover:underline"
              >
                Ver estoque
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-1 font-semibold tracking-[-0.01em]">Atividade recente</p>
              {activity.length === 0 ? (
                <EmptyState icon={Receipt} title="Nenhuma atividade ainda" description="Comece realizando sua primeira venda." actionLabel="Nova venda" actionHref="/dashboard/sales/new" />
              ) : (
                <ActivityTimeline items={activity} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

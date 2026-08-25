import Link from "next/link";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getDashboardData } from "@/features/dashboard/queries";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/empty-state";
import {
  Receipt,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  PlusCircle,
  PackagePlus,
  HandCoins,
  ShoppingBag,
} from "lucide-react";

export default async function DashboardPage() {
  const tenant = await getCurrentTenant();
  const data = await getDashboardData(tenant.companyId);

  const kpis = [
    { label: "Vendas hoje", value: data.vendasHoje.toString(), icon: Receipt },
    { label: "Faturamento hoje", value: formatCurrency(data.faturamentoHoje), icon: TrendingUp },
    { label: "Lucro hoje", value: formatCurrency(data.lucroHoje), icon: TrendingUp },
    { label: "Saldo em caixa", value: data.saldoCaixa === null ? "Caixa fechado" : formatCurrency(data.saldoCaixa), icon: Wallet },
    { label: "Contas a receber", value: formatCurrency(data.contasReceber), icon: ArrowDownCircle },
    { label: "Contas a pagar", value: formatCurrency(data.contasPagar), icon: ArrowUpCircle },
  ];

  const quickActions = [
    { label: "Nova venda", href: "/dashboard/sales/new", icon: PlusCircle },
    { label: "Entrada", href: "/dashboard/purchases/new", icon: PackagePlus },
    { label: "Receber", href: "/dashboard/finance/receivables", icon: HandCoins },
    { label: "Nova compra", href: "/dashboard/purchases/new", icon: ShoppingBag },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Olá, {tenant.userName.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">Resumo da {tenant.company.nomeFantasia} hoje</p>
      </div>

      {data.estoqueBaixo > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          {data.estoqueBaixo} produto{data.estoqueBaixo > 1 ? "s estão" : " está"} com estoque baixo.
          <Link href="/dashboard/products?filter=low-stock" className="ml-auto font-medium underline">
            Ver produtos
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center text-xs font-medium shadow-sm transition-colors hover:bg-muted"
          >
            <a.icon className="size-5 text-primary" />
            {a.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 pt-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <kpi.icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5">
          <p className="mb-3 font-semibold">Últimas vendas</p>
          {data.recentSales.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nenhuma venda encontrada"
              description="Comece realizando sua primeira venda."
              actionLabel="Nova venda"
              actionHref="/dashboard/sales/new"
            />
          ) : (
            <div className="divide-y divide-border">
              {data.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{sale.customer?.name ?? "Consumidor final"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(sale.createdAt)}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(sale.totalAmount.toString())}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

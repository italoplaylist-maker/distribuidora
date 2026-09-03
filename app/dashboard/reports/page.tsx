import { TrendingUp, TrendingDown } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getSalesReport, getStockReport, getFinanceReport, getPurchasesReport, getProfitabilityAnalysis, type ProfitabilityPeriod } from "@/features/reports/queries";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { PAYMENT_METHOD_LABELS } from "@/lib/status";
import { formatCurrency, cn } from "@/lib/utils";
import { ProfitabilityChart } from "@/components/reports/profitability-chart";
import { CsvExportButton } from "@/components/csv-export-button";

const TRANSACTION_LABELS: Record<string, string> = { PAYMENT: "Pagamentos", RECEIPT: "Recebimentos", EXPENSE: "Despesas", REVENUE: "Receitas" };

export default async function ReportsPage() {
  const tenant = await getCurrentTenant();
  const [sales, stock, finance, purchases, profitability] = await Promise.all([
    getSalesReport(tenant.companyId),
    getStockReport(tenant.companyId),
    getFinanceReport(tenant.companyId),
    getPurchasesReport(tenant.companyId),
    getProfitabilityAnalysis(tenant.companyId),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Relatórios" description="Desempenho da empresa por período" />

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="finance">Financeiro</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="profitability">Rentabilidade</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-end">
            <CsvExportButton
              filename="produtos-mais-vendidos.csv"
              headers={["Produto", "Quantidade", "Total"]}
              rows={sales.topProducts.map((p) => [p.name, p.quantity, p.total])}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Faturamento total" value={formatCurrency(sales.totalRevenue)} />
            <StatCard label="Total de vendas" value={sales.totalSales} />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-[14px] font-semibold">Por forma de pagamento</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Forma</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.byPaymentMethod.map((p) => (
                    <TableRow key={p.method}>
                      <TableCell>{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</TableCell>
                      <TableCell>{p.count}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-[14px] font-semibold">Produtos mais vendidos</p>
                <div className="divide-y divide-border/60">
                  {sales.topProducts.map((p, i) => (
                    <div key={i} className="flex justify-between py-2.5 text-[13.5px]">
                      <span>{p.name}</span>
                      <span className="font-medium">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-[14px] font-semibold">Melhores clientes</p>
                <div className="divide-y divide-border/60">
                  {sales.topCustomers.map((c, i) => (
                    <div key={i} className="flex justify-between py-2.5 text-[13.5px]">
                      <span>{c.name}</span>
                      <span className="font-medium">{formatCurrency(c.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex justify-end">
            <CsvExportButton
              filename="estoque.csv"
              headers={["Produto", "SKU", "Estoque", "Unidade", "Custo médio", "Preço", "Valor investido", "Valor potencial", "Margem (%)"]}
              rows={stock.exportRows.map((r) => [r.nome, r.sku, r.estoque, r.unidade, r.custoMedio, r.preco, r.valorInvestido, r.valorPotencial, r.margem !== null ? r.margem.toFixed(1) : null])}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <StatCard label="Valor investido" value={formatCurrency(stock.totalValue)} />
            <StatCard label="Valor potencial de venda" value={formatCurrency(stock.totalPotential)} />
            <StatCard label="Lucro potencial" value={formatCurrency(stock.potentialProfit)} accent={stock.potentialProfit >= 0 ? undefined : "destructive"} />
            <StatCard label="Produtos parados" value={stock.staleCount} accent={stock.staleCount > 0 ? "warning" : undefined} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <StatCard label="Produtos ativos" value={stock.totalProducts} />
            <StatCard label="Estoque baixo" value={stock.lowStockCount} accent="warning" />
            <StatCard label="Zerados" value={stock.zeroStockCount} accent="destructive" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-[14px] font-semibold">Maior giro (30 dias)</p>
                <div className="divide-y divide-border/60">
                  {stock.topTurnover.map((p, i) => (
                    <div key={i} className="flex justify-between py-2.5 text-[13.5px]">
                      <span>{p.name}</span>
                      <span className="font-medium">{p.quantity} un.</span>
                    </div>
                  ))}
                  {stock.topTurnover.length === 0 && <p className="py-2.5 text-[13.5px] text-muted-foreground">Nenhuma venda nos últimos 30 dias.</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-[14px] font-semibold">Produtos parados (sem venda em 30 dias)</p>
                <div className="divide-y divide-border/60">
                  {stock.staleProducts.map((p, i) => (
                    <div key={i} className="flex justify-between py-2.5 text-[13.5px]">
                      <span>{p.name}</span>
                      <span className="text-muted-foreground">
                        {p.stock} {p.unit}
                      </span>
                    </div>
                  ))}
                  {stock.staleProducts.length === 0 && <p className="py-2.5 text-[13.5px] text-muted-foreground">Nenhum produto parado.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-[14px] font-semibold">Maior margem</p>
                <div className="divide-y divide-border/60">
                  {stock.topMargin.map((p, i) => (
                    <div key={i} className="flex justify-between py-2.5 text-[13.5px]">
                      <span>{p.name}</span>
                      <span className="font-medium text-success">{p.margin.toFixed(1)}%</span>
                    </div>
                  ))}
                  {stock.topMargin.length === 0 && <p className="py-2.5 text-[13.5px] text-muted-foreground">Sem dados suficientes.</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-[14px] font-semibold">Menor margem</p>
                <div className="divide-y divide-border/60">
                  {stock.bottomMargin.map((p, i) => (
                    <div key={i} className="flex justify-between py-2.5 text-[13.5px]">
                      <span>{p.name}</span>
                      <span className={`font-medium ${p.margin < 10 ? "text-destructive" : ""}`}>{p.margin.toFixed(1)}%</span>
                    </div>
                  ))}
                  {stock.bottomMargin.length === 0 && <p className="py-2.5 text-[13.5px] text-muted-foreground">Sem dados suficientes.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-[14px] font-semibold">Estoque baixo</p>
                <div className="divide-y divide-border/60">
                  {stock.lowStockProducts.map((p, i) => (
                    <div key={i} className="flex justify-between py-2.5 text-[13.5px]">
                      <span>{p.name}</span>
                      <span className="text-warning">
                        {p.stock} / mín {p.minStock}
                      </span>
                    </div>
                  ))}
                  {stock.lowStockProducts.length === 0 && <p className="py-2.5 text-[13.5px] text-muted-foreground">Nenhum produto com estoque baixo.</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-[14px] font-semibold">Estoque zerado</p>
                <div className="divide-y divide-border/60">
                  {stock.zeroStockProducts.map((p, i) => (
                    <div key={i} className="py-2.5 text-[13.5px]">
                      {p.name}
                    </div>
                  ))}
                  {stock.zeroStockProducts.length === 0 && <p className="py-2.5 text-[13.5px] text-muted-foreground">Nenhum produto zerado.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Contas a receber em aberto" value={formatCurrency(finance.receivablesOpen)} />
            <StatCard label="Contas a pagar em aberto" value={formatCurrency(finance.payablesOpen)} />
            <StatCard label="Contas vencidas" value={finance.overdueReceivablesCount} accent="destructive" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-1 text-[14px] font-semibold">Fluxo por tipo de transação</p>
              <div className="divide-y divide-border/60">
                {finance.byType.map((t) => (
                  <div key={t.type} className="flex justify-between py-2.5 text-[13.5px]">
                    <span>{TRANSACTION_LABELS[t.type] ?? t.type}</span>
                    <span className="font-medium">{formatCurrency(t.total)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <div className="flex justify-end">
            <CsvExportButton
              filename="compras-por-fornecedor.csv"
              headers={["Fornecedor", "Compras", "Total"]}
              rows={purchases.bySupplier.map((s) => [s.name, s.count, s.total])}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total gasto em compras" value={formatCurrency(purchases.totalSpent)} />
            <StatCard label="Total de compras" value={purchases.totalPurchases} />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-[14px] font-semibold">Por fornecedor</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Compras</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.bySupplier.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.count}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(s.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <div className="flex justify-end">
            <CsvExportButton
              filename="rentabilidade-mensal.csv"
              headers={["Mês", "Faturamento", "Custo", "Lucro bruto"]}
              rows={profitability.monthlyEvolution.map((m) => [m.label, m.faturamento, m.custo, m.lucroBruto])}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ComparisonCard title="Mês atual vs. mês anterior" current={profitability.currentMonth} previous={profitability.previousMonth} variation={profitability.monthVariation} />
            <ComparisonCard title="Ano atual vs. mesmo período do ano anterior" current={profitability.currentYear} previous={profitability.previousYearToDate} variation={profitability.yearVariation} />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-[14px] font-semibold">Evolução mensal (6 meses)</p>
              <ProfitabilityChart data={profitability.monthlyEvolution} />
            </CardContent>
          </Card>
          <p className="text-[12.5px] text-muted-foreground">
            O custo considera o custo médio atual de cada produto (o sistema não guarda custo histórico por lote). Este relatório mostra lucro bruto — o
            sistema ainda não rastreia despesas operacionais (aluguel, salários etc.) separadas do custo de mercadoria, então lucro líquido não é exibido
            para não inventar um número sem essa base de dados.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComparisonCard({
  title,
  current,
  previous,
  variation,
}: {
  title: string;
  current: ProfitabilityPeriod;
  previous: ProfitabilityPeriod;
  variation: { faturamento: number | null; lucroBruto: number | null };
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-[14px] font-semibold">{title}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[12px] text-muted-foreground">Faturamento</p>
            <p className="text-[19px] font-semibold">{formatCurrency(current.faturamento)}</p>
            <VariationBadge value={variation.faturamento} />
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Lucro bruto</p>
            <p className={cn("text-[19px] font-semibold", current.lucroBruto < 0 && "text-destructive")}>{formatCurrency(current.lucroBruto)}</p>
            <VariationBadge value={variation.lucroBruto} />
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Custo</p>
            <p className="text-[15px] font-medium text-muted-foreground">{formatCurrency(current.custo)}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Margem bruta</p>
            <p className="text-[15px] font-medium">{current.margem !== null ? `${current.margem.toFixed(1)}%` : "—"}</p>
          </div>
        </div>
        <p className="border-t border-border/60 pt-3 text-[12px] text-muted-foreground">
          Período anterior: {formatCurrency(previous.faturamento)} faturados, {formatCurrency(previous.lucroBruto)} de lucro bruto.
        </p>
      </CardContent>
    </Card>
  );
}

function VariationBadge({ value }: { value: number | null }) {
  if (value === null) return <p className="text-[12px] text-muted-foreground">Sem comparativo</p>;
  const up = value >= 0;
  return (
    <p className={cn("flex items-center gap-1 text-[12px] font-medium", up ? "text-success" : "text-destructive")}>
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </p>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: "warning" | "destructive" }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-[12.5px] text-muted-foreground">{label}</p>
        <p className={`text-[19px] font-semibold ${accent === "warning" ? "text-warning" : accent === "destructive" ? "text-destructive" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getSalesReport, getStockReport, getFinanceReport, getPurchasesReport } from "@/features/reports/queries";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = { cash: "Dinheiro", pix: "Pix", debit: "Débito", credit: "Crédito", fiado: "Fiado" };
const TRANSACTION_LABELS: Record<string, string> = { PAYMENT: "Pagamentos", RECEIPT: "Recebimentos", EXPENSE: "Despesas", REVENUE: "Receitas" };

export default async function ReportsPage() {
  const tenant = await getCurrentTenant();
  const [sales, stock, finance, purchases] = await Promise.all([
    getSalesReport(tenant.companyId),
    getStockReport(tenant.companyId),
    getFinanceReport(tenant.companyId),
    getPurchasesReport(tenant.companyId),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Relatórios</h1>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="finance">Financeiro</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Faturamento total" value={formatCurrency(sales.totalRevenue)} />
            <StatCard label="Total de vendas" value={sales.totalSales} />
          </div>
          <Card>
            <CardContent className="pt-5">
              <p className="mb-3 font-semibold">Por forma de pagamento</p>
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
                      <TableCell>{PAYMENT_LABELS[p.method] ?? p.method}</TableCell>
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
              <CardContent className="pt-5">
                <p className="mb-3 font-semibold">Produtos mais vendidos</p>
                <div className="divide-y divide-border">
                  {sales.topProducts.map((p, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm">
                      <span>{p.name}</span>
                      <span className="font-medium">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="mb-3 font-semibold">Melhores clientes</p>
                <div className="divide-y divide-border">
                  {sales.topCustomers.map((c, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm">
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
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Produtos ativos" value={stock.totalProducts} />
            <StatCard label="Valor em estoque" value={formatCurrency(stock.totalValue)} />
            <StatCard label="Estoque baixo" value={stock.lowStockCount} />
            <StatCard label="Zerados" value={stock.zeroStockCount} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-5">
                <p className="mb-3 font-semibold">Estoque baixo</p>
                <div className="divide-y divide-border">
                  {stock.lowStockProducts.map((p, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm">
                      <span>{p.name}</span>
                      <span className="text-warning">{p.stock} / mín {p.minStock}</span>
                    </div>
                  ))}
                  {stock.lowStockProducts.length === 0 && <p className="py-2 text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="mb-3 font-semibold">Estoque zerado</p>
                <div className="divide-y divide-border">
                  {stock.zeroStockProducts.map((p, i) => (
                    <div key={i} className="py-2 text-sm">
                      {p.name}
                    </div>
                  ))}
                  {stock.zeroStockProducts.length === 0 && <p className="py-2 text-sm text-muted-foreground">Nenhum produto zerado.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Contas a receber em aberto" value={formatCurrency(finance.receivablesOpen)} />
            <StatCard label="Contas a pagar em aberto" value={formatCurrency(finance.payablesOpen)} />
            <StatCard label="Contas vencidas" value={finance.overdueReceivablesCount} />
          </div>
          <Card>
            <CardContent className="pt-5">
              <p className="mb-3 font-semibold">Fluxo por tipo de transação</p>
              <div className="divide-y divide-border">
                {finance.byType.map((t) => (
                  <div key={t.type} className="flex justify-between py-2 text-sm">
                    <span>{TRANSACTION_LABELS[t.type] ?? t.type}</span>
                    <span className="font-medium">{formatCurrency(t.total)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Total gasto em compras" value={formatCurrency(purchases.totalSpent)} />
            <StatCard label="Total de compras" value={purchases.totalPurchases} />
          </div>
          <Card>
            <CardContent className="pt-5">
              <p className="mb-3 font-semibold">Por fornecedor</p>
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
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

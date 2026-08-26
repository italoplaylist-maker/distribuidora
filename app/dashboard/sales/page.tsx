import Link from "next/link";
import { PlusCircle, Receipt } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listSales } from "@/features/sales/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { saleStatus, PAYMENT_METHOD_LABELS } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SalesPage() {
  const tenant = await getCurrentTenant();
  const sales = await listSales(tenant.companyId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendas"
        description={`${sales.length} vendas registradas`}
        action={
          <Button asChild>
            <Link href="/dashboard/sales/new">
              <PlusCircle className="size-4" /> Nova venda
            </Link>
          </Button>
        }
      />

      {sales.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhuma venda encontrada" description="Comece realizando sua primeira venda." actionLabel="Nova venda" actionHref="/dashboard/sales/new" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {sales.map((s) => {
              const status = saleStatus(s.status);
              return (
                <Link key={s.id} href={`/dashboard/sales/${s.id}`}>
                  <Card className="transition-colors hover:border-primary/25">
                    <CardContent className="flex items-center justify-between gap-3 pt-5">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.customer?.name ?? "Consumidor final"}</p>
                        <p className="text-[12.5px] text-muted-foreground">
                          {formatDate(s.createdAt)} · {PAYMENT_METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod} · {s.items.length} itens
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold">{formatCurrency(s.totalAmount.toString())}</p>
                        <StatusBadge {...status} className="mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => {
                  const status = saleStatus(s.status);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/dashboard/sales/${s.id}`} className="font-medium hover:underline">
                          {formatDate(s.createdAt)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.customer?.name ?? "Consumidor final"}</TableCell>
                      <TableCell className="text-muted-foreground">{PAYMENT_METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod}</TableCell>
                      <TableCell className="text-muted-foreground">{s.items.length}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(s.totalAmount.toString())}</TableCell>
                      <TableCell>
                        <StatusBadge {...status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { PlusCircle, ShoppingCart } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listPurchases } from "@/features/purchases/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { purchaseStatus } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PurchasesPage() {
  const tenant = await getCurrentTenant();
  const purchases = await listPurchases(tenant.companyId);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compras"
        description={`${purchases.length} compras registradas`}
        action={
          <Button asChild>
            <Link href="/dashboard/purchases/new">
              <PlusCircle className="size-4" /> Nova compra
            </Link>
          </Button>
        }
      />

      {purchases.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Nenhuma compra encontrada" description="Registre sua primeira compra de mercadorias." actionLabel="Nova compra" actionHref="/dashboard/purchases/new" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {purchases.map((p) => {
              const status = purchaseStatus(p.status);
              return (
                <Link key={p.id} href={`/dashboard/purchases/${p.id}`}>
                  <Card className="transition-colors hover:border-primary/25">
                    <CardContent className="flex items-center justify-between gap-3 pt-5">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.supplier.name}</p>
                        <p className="text-[12.5px] text-muted-foreground">
                          {formatDate(p.createdAt)} · {p.paymentTerm === "CASH" ? "À vista" : "A prazo"} · {p.items.length} itens
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold">{formatCurrency(p.totalAmount.toString())}</p>
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
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => {
                  const status = purchaseStatus(p.status);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/dashboard/purchases/${p.id}`} className="font-medium hover:underline">
                          {formatDate(p.createdAt)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.supplier.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.paymentTerm === "CASH" ? "À vista" : "A prazo"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.items.length}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.totalAmount.toString())}</TableCell>
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

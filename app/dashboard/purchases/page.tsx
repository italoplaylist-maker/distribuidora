import Link from "next/link";
import { PlusCircle, ShoppingCart } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listPurchases } from "@/features/purchases/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function PurchasesPage() {
  const tenant = await getCurrentTenant();
  const purchases = await listPurchases(tenant.companyId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Compras</h1>
          <p className="text-sm text-muted-foreground">{purchases.length} compras registradas</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/purchases/new">
            <PlusCircle className="size-4" /> Nova compra
          </Link>
        </Button>
      </div>

      {purchases.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Nenhuma compra encontrada" description="Registre sua primeira compra de mercadorias." actionLabel="Nova compra" actionHref="/dashboard/purchases/new" />
      ) : (
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
            {purchases.map((p) => (
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
                  {p.status === "CANCELED" ? <Badge variant="destructive">Cancelada</Badge> : <Badge variant="success">Recebida</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

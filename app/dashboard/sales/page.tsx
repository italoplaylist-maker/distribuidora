import Link from "next/link";
import { PlusCircle, Receipt } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listSales } from "@/features/sales/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = { cash: "Dinheiro", pix: "Pix", debit: "Débito", credit: "Crédito", fiado: "Fiado" };

export default async function SalesPage() {
  const tenant = await getCurrentTenant();
  const sales = await listSales(tenant.companyId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Vendas</h1>
          <p className="text-sm text-muted-foreground">{sales.length} vendas registradas</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sales/new">
            <PlusCircle className="size-4" /> Nova venda
          </Link>
        </Button>
      </div>

      {sales.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhuma venda encontrada" description="Comece realizando sua primeira venda." actionLabel="Nova venda" actionHref="/dashboard/sales/new" />
      ) : (
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
            {sales.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Link href={`/dashboard/sales/${s.id}`} className="font-medium hover:underline">
                    {formatDate(s.createdAt)}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.customer?.name ?? "Consumidor final"}</TableCell>
                <TableCell className="text-muted-foreground">{PAYMENT_LABELS[s.paymentMethod] ?? s.paymentMethod}</TableCell>
                <TableCell className="text-muted-foreground">{s.items.length}</TableCell>
                <TableCell className="font-medium">{formatCurrency(s.totalAmount.toString())}</TableCell>
                <TableCell>
                  {s.status === "CANCELED" ? <Badge variant="destructive">Cancelada</Badge> : <Badge variant="success">Concluída</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

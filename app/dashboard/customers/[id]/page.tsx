import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Receipt, HandCoins, History } from "lucide-react";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { getCustomerOrThrow, getCustomerSalesHistory, getCustomerOpenReceivables } from "@/features/customers/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let customer;
  try {
    customer = await getCustomerOrThrow(tenant.companyId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const [sales, receivables] = await Promise.all([
    getCustomerSalesHistory(tenant.companyId, id),
    getCustomerOpenReceivables(tenant.companyId, id),
  ]);

  const totalOpen = receivables.reduce((sum, r) => sum + Number(r.amount) - Number(r.paidAmount), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">{customer.phone ?? "Sem telefone"} · {customer.document ?? "Sem documento"}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/customers/${id}/edit`}>
            <Pencil className="size-4" /> Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4">
          <Link href={`/dashboard/sales/new?customerId=${id}`}>
            <Receipt className="size-5 text-primary" /> Nova venda
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4">
          <Link href={`/dashboard/finance/receivables?customerId=${id}`}>
            <HandCoins className="size-5 text-primary" /> Receber
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
          <a href="#historico">
            <History className="size-5 text-primary" /> Histórico
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Limite de crédito</p>
            <p className="text-lg font-bold">{formatCurrency(customer.creditLimit.toString())}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Em aberto</p>
            <p className={`text-lg font-bold ${totalOpen > 0 ? "text-destructive" : ""}`}>{formatCurrency(totalOpen)}</p>
          </CardContent>
        </Card>
      </div>

      <Card id="historico">
        <CardContent className="pt-5">
          <p className="mb-3 font-semibold">Últimas vendas</p>
          {sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>
          ) : (
            <div className="divide-y divide-border">
              {sales.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{formatDate(s.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">{s.paymentMethod}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{formatCurrency(s.totalAmount.toString())}</p>
                    {s.status === "CANCELED" && <Badge variant="destructive">Cancelada</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

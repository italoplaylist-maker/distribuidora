import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Receipt, HandCoins, CheckCircle2, XCircle } from "lucide-react";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { getCustomerOrThrow, getCustomerSalesHistory, getCustomerOpenReceivables } from "@/features/customers/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityTimeline, type ActivityItem } from "@/components/activity-timeline";
import { PAYMENT_METHOD_LABELS } from "@/lib/status";
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

  const activity: ActivityItem[] = sales.map((s) => ({
    id: s.id,
    icon: s.status === "CANCELED" ? XCircle : CheckCircle2,
    tone: s.status === "CANCELED" ? "neutral" : "success",
    title: `Venda #${s.id.slice(-6)}`,
    subtitle: s.status === "CANCELED" ? "Cancelada" : (PAYMENT_METHOD_LABELS[s.paymentMethod] ?? s.paymentMethod),
    amount: Number(s.totalAmount),
    time: formatDate(s.createdAt),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">{customer.name}</h1>
          <p className="text-[13.5px] text-muted-foreground">
            {customer.phone ?? "Sem telefone"} · {customer.document ?? "Sem documento"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/customers/${id}/edit`}>
            <Pencil className="size-4" /> Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
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
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Card>
          <CardContent className="pt-5">
            <p className="text-[12.5px] text-muted-foreground">Limite de crédito</p>
            <p className="text-[19px] font-semibold">{formatCurrency(customer.creditLimit.toString())}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-[12.5px] text-muted-foreground">Em aberto</p>
            <p className={`text-[19px] font-semibold ${totalOpen > 0 ? "text-destructive" : ""}`}>{formatCurrency(totalOpen)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <p className="mb-1 text-[14px] font-semibold">Últimas vendas</p>
          <ActivityTimeline items={activity} />
        </CardContent>
      </Card>
    </div>
  );
}

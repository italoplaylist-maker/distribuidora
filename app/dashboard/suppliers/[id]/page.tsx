import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ShoppingCart, CheckCircle2, XCircle } from "lucide-react";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { getSupplierOrThrow, getSupplierPurchaseHistory } from "@/features/suppliers/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityTimeline, type ActivityItem } from "@/components/activity-timeline";
import { formatDate } from "@/lib/utils";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let supplier;
  try {
    supplier = await getSupplierOrThrow(tenant.companyId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const purchases = await getSupplierPurchaseHistory(tenant.companyId, id);

  const activity: ActivityItem[] = purchases.map((p) => ({
    id: p.id,
    icon: p.status === "CANCELED" ? XCircle : CheckCircle2,
    tone: p.status === "CANCELED" ? "neutral" : "success",
    title: `Compra #${p.id.slice(-6)}`,
    subtitle: p.status === "CANCELED" ? "Cancelada" : p.paymentTerm === "CASH" ? "À vista" : "A prazo",
    amount: Number(p.totalAmount),
    time: formatDate(p.createdAt),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">{supplier.name}</h1>
          <p className="text-[13.5px] text-muted-foreground">
            {supplier.phone ?? "Sem telefone"} · {supplier.email ?? "Sem e-mail"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/suppliers/${id}/edit`}>
            <Pencil className="size-4" /> Editar
          </Link>
        </Button>
      </div>

      <Button variant="outline" asChild className="h-auto w-full flex-col gap-2 py-4">
        <Link href={`/dashboard/purchases/new?supplierId=${id}`}>
          <ShoppingCart className="size-5 text-primary" /> Nova compra
        </Link>
      </Button>

      <Card>
        <CardContent className="pt-5">
          <p className="mb-1 text-[14px] font-semibold">Últimas compras</p>
          <ActivityTimeline items={activity} />
        </CardContent>
      </Card>
    </div>
  );
}

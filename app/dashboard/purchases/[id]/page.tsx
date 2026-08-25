import { notFound } from "next/navigation";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { roleHasPermission, PERMISSIONS } from "@/lib/permissions/permissions";
import { getPurchaseOrThrow } from "@/features/purchases/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CancelPurchaseButton } from "@/features/purchases/cancel-purchase-button";

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let purchase;
  try {
    purchase = await getPurchaseOrThrow(tenant.companyId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const canCancel = roleHasPermission(tenant.role, PERMISSIONS.PURCHASES_CANCEL) && purchase.status === "RECEIVED";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Compra #{purchase.id.slice(-6)}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(purchase.createdAt)} · {purchase.supplier.name} · {purchase.user.name}
          </p>
        </div>
        {purchase.status === "CANCELED" ? <Badge variant="destructive">Cancelada</Badge> : <Badge variant="success">Recebida</Badge>}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="divide-y divide-border">
            {purchase.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity.toString()} x {formatCurrency(item.unitCost.toString())}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(item.totalCost.toString())}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-border pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(purchase.totalAmount.toString())}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Condição</span>
            <span>{purchase.paymentTerm === "CASH" ? "À vista" : "A prazo"}</span>
          </div>

          {purchase.status === "CANCELED" && purchase.cancelReason && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Motivo do cancelamento: {purchase.cancelReason}</p>
          )}
        </CardContent>
      </Card>

      {canCancel && <CancelPurchaseButton purchaseId={purchase.id} />}
    </div>
  );
}

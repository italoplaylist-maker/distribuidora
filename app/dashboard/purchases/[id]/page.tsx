import { notFound } from "next/navigation";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { roleHasPermission, PERMISSIONS } from "@/lib/permissions/permissions";
import { getPurchaseOrThrow } from "@/features/purchases/queries";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { purchaseStatus } from "@/lib/status";
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
  const status = purchaseStatus(purchase.status);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Compra #{purchase.id.slice(-6)}</h1>
          <p className="text-[13.5px] text-muted-foreground">
            {formatDate(purchase.createdAt)} · {purchase.supplier.name} · {purchase.user.name}
          </p>
        </div>
        <StatusBadge {...status} />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="divide-y divide-border/60">
            {purchase.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {item.quantity.toString()} x {formatCurrency(item.unitCost.toString())}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(item.totalCost.toString())}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 border-t border-border/70 pt-3.5 text-[13.5px]">
            <div className="flex justify-between text-[19px] font-semibold">
              <span>Total</span>
              <span>{formatCurrency(purchase.totalAmount.toString())}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Condição</span>
              <span>{purchase.paymentTerm === "CASH" ? "À vista" : "A prazo"}</span>
            </div>
          </div>

          {purchase.status === "CANCELED" && purchase.cancelReason && (
            <p className="rounded-md bg-destructive/10 p-3 text-[13px] text-destructive">Motivo do cancelamento: {purchase.cancelReason}</p>
          )}
        </CardContent>
      </Card>

      {canCancel && <CancelPurchaseButton purchaseId={purchase.id} />}
    </div>
  );
}

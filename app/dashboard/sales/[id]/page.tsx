import { notFound } from "next/navigation";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { roleHasPermission, PERMISSIONS } from "@/lib/permissions/permissions";
import { getSaleOrThrow } from "@/features/sales/queries";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { saleStatus, PAYMENT_METHOD_LABELS } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CancelSaleButton } from "@/features/sales/cancel-sale-button";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let sale;
  try {
    sale = await getSaleOrThrow(tenant.companyId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const canCancel = roleHasPermission(tenant.role, PERMISSIONS.SALES_CANCEL) && sale.status === "COMPLETED";
  const status = saleStatus(sale.status);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">Venda #{sale.id.slice(-6)}</h1>
          <p className="text-[13.5px] text-muted-foreground">
            {formatDate(sale.createdAt)} · {sale.customer?.name ?? "Consumidor final"} · {sale.user.name}
          </p>
        </div>
        <StatusBadge {...status} />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="divide-y divide-border/60">
            {sale.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {item.quantity.toString()} x {formatCurrency(item.unitPrice.toString())}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(item.totalPrice.toString())}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 border-t border-border/70 pt-3.5 text-[13.5px]">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.subtotal.toString())}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Desconto</span>
                <span>-{formatCurrency(sale.discount.toString())}</span>
              </div>
            )}
            <div className="flex justify-between text-[19px] font-semibold">
              <span>Total</span>
              <span>{formatCurrency(sale.totalAmount.toString())}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Forma de pagamento</span>
              <span>{PAYMENT_METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
            </div>
          </div>

          {sale.status === "CANCELED" && sale.cancelReason && (
            <p className="rounded-md bg-destructive/10 p-3 text-[13px] text-destructive">Motivo do cancelamento: {sale.cancelReason}</p>
          )}
        </CardContent>
      </Card>

      {canCancel && <CancelSaleButton saleId={sale.id} />}
    </div>
  );
}

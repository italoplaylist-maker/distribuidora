import { notFound } from "next/navigation";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { roleHasPermission, PERMISSIONS } from "@/lib/permissions/permissions";
import { getSaleOrThrow } from "@/features/sales/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CancelSaleButton } from "@/features/sales/cancel-sale-button";

const PAYMENT_LABELS: Record<string, string> = { cash: "Dinheiro", pix: "Pix", debit: "Débito", credit: "Crédito", fiado: "Fiado" };

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

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Venda #{sale.id.slice(-6)}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(sale.createdAt)} · {sale.customer?.name ?? "Consumidor final"} · {sale.user.name}
          </p>
        </div>
        {sale.status === "CANCELED" ? <Badge variant="destructive">Cancelada</Badge> : <Badge variant="success">Concluída</Badge>}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="divide-y divide-border">
            {sale.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity.toString()} x {formatCurrency(item.unitPrice.toString())}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(item.totalPrice.toString())}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t border-border pt-3 text-sm">
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
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(sale.totalAmount.toString())}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Forma de pagamento</span>
              <span>{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</span>
            </div>
          </div>

          {sale.status === "CANCELED" && sale.cancelReason && (
            <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Motivo do cancelamento: {sale.cancelReason}</p>
          )}
        </CardContent>
      </Card>

      {canCancel && <CancelSaleButton saleId={sale.id} />}
    </div>
  );
}

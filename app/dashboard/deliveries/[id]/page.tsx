import { notFound } from "next/navigation";
import { getCurrentTenant, NotFoundError, ForbiddenError } from "@/lib/tenant/tenant-context";
import { getDeliveryOrThrow, listActiveDrivers } from "@/features/deliveries/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { DeliveryStatusActions } from "@/features/deliveries/status-actions";
import { AssignDriverSelect } from "@/features/deliveries/assign-driver-select";

const STATUS_INFO: Record<string, { label: string; variant: "warning" | "secondary" | "success" | "destructive" }> = {
  PENDING: { label: "Pendente", variant: "warning" },
  IN_ROUTE: { label: "Em rota", variant: "secondary" },
  DELIVERED: { label: "Entregue", variant: "success" },
  FAILED: { label: "Falhou", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
};

export default async function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let delivery;
  try {
    delivery = await getDeliveryOrThrow(tenant.companyId, id);
    if (tenant.role === "MOTORISTA" && delivery.driver?.userId !== tenant.userId) {
      throw new ForbiddenError();
    }
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) notFound();
    throw err;
  }

  const drivers = tenant.role !== "MOTORISTA" ? await listActiveDrivers(tenant.companyId) : [];
  const info = STATUS_INFO[delivery.status];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{delivery.customer?.name ?? "Consumidor final"}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(delivery.createdAt)} · {delivery.address ?? "Sem endereço"}</p>
        </div>
        <Badge variant={info.variant}>{info.label}</Badge>
      </div>

      {tenant.role !== "MOTORISTA" && (
        <AssignDriverSelect deliveryId={delivery.id} drivers={drivers.map((d) => ({ id: d.id, name: d.name }))} currentDriverId={delivery.driverId} />
      )}

      <Card>
        <CardContent className="pt-5">
          <p className="mb-3 font-semibold">Itens da entrega</p>
          <div className="divide-y divide-border">
            {delivery.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                <p>{item.product.name}</p>
                <p className="font-medium">{item.quantity.toString()} {item.product.unit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DeliveryStatusActions deliveryId={delivery.id} status={delivery.status} />
    </div>
  );
}

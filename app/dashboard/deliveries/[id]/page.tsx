import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getCurrentTenant, NotFoundError, ForbiddenError } from "@/lib/tenant/tenant-context";
import { getDeliveryOrThrow, listActiveDrivers } from "@/features/deliveries/queries";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { deliveryStatus } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { DeliveryStatusActions } from "@/features/deliveries/status-actions";
import { AssignDriverSelect } from "@/features/deliveries/assign-driver-select";

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
  const status = deliveryStatus(delivery.status);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">{delivery.customer?.name ?? "Consumidor final"}</h1>
          <p className="text-[13.5px] text-muted-foreground">{formatDate(delivery.createdAt)}</p>
          {delivery.address && (
            <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" /> {delivery.address}
            </p>
          )}
        </div>
        <StatusBadge {...status} />
      </div>

      {tenant.role !== "MOTORISTA" && (
        <AssignDriverSelect deliveryId={delivery.id} drivers={drivers.map((d) => ({ id: d.id, name: d.name }))} currentDriverId={delivery.driverId} />
      )}

      <Card>
        <CardContent className="pt-6">
          <p className="mb-1 text-[14px] font-semibold">Itens da entrega</p>
          <div className="divide-y divide-border/60">
            {delivery.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                <p>{item.product.name}</p>
                <p className="font-medium">
                  {item.quantity.toString()} {item.product.unit}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DeliveryStatusActions deliveryId={delivery.id} status={delivery.status} />
    </div>
  );
}

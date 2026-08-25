import Link from "next/link";
import { Truck } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listDeliveries } from "@/features/deliveries/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/utils";

const STATUS_INFO: Record<string, { label: string; variant: "warning" | "secondary" | "success" | "destructive" }> = {
  PENDING: { label: "Pendente", variant: "warning" },
  IN_ROUTE: { label: "Em rota", variant: "secondary" },
  DELIVERED: { label: "Entregue", variant: "success" },
  FAILED: { label: "Falhou", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
};

export default async function DeliveriesPage() {
  const tenant = await getCurrentTenant();
  const deliveries = await listDeliveries(tenant.companyId, tenant.role, tenant.userId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Entregas</h1>
      {deliveries.length === 0 ? (
        <EmptyState icon={Truck} title="Nenhuma entrega encontrada" description="Entregas vinculadas a vendas aparecerão aqui." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {deliveries.map((d) => {
            const info = STATUS_INFO[d.status];
            return (
              <Link key={d.id} href={`/dashboard/deliveries/${d.id}`}>
                <Card className="transition-colors hover:bg-muted">
                  <CardContent className="space-y-2 pt-5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{d.customer?.name ?? "Consumidor final"}</p>
                      <Badge variant={info.variant}>{info.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{d.driver?.name ?? "Sem motorista atribuído"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)} · {d.items.length} itens</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

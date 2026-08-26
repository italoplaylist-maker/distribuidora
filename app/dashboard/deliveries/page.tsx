import Link from "next/link";
import { Truck, MapPin, ArrowRight } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listDeliveries } from "@/features/deliveries/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { deliveryStatus } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default async function DeliveriesPage() {
  const tenant = await getCurrentTenant();
  const deliveries = await listDeliveries(tenant.companyId, tenant.role, tenant.userId);

  if (tenant.role === "MOTORISTA") {
    const pending = deliveries.filter((d) => d.status === "PENDING" || d.status === "IN_ROUTE");
    const done = deliveries.filter((d) => d.status === "DELIVERED" || d.status === "FAILED" || d.status === "CANCELED");
    const next = pending[0];

    return (
      <div className="mx-auto max-w-lg space-y-5">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.015em]">Hoje</h1>
          <p className="text-[13.5px] text-muted-foreground">
            {pending.length === 0 ? "Nenhuma entrega pendente" : `${pending.length} ${pending.length === 1 ? "entrega" : "entregas"} para fazer`}
          </p>
        </div>

        {next ? (
          <Link href={`/dashboard/deliveries/${next.id}`}>
            <Card className="border-primary/25 bg-primary/5 transition-colors hover:border-primary/40">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-medium uppercase tracking-wide text-primary">Próxima entrega</span>
                  <StatusBadge {...deliveryStatus(next.status)} />
                </div>
                <div>
                  <p className="text-[19px] font-semibold">{next.customer?.name ?? "Consumidor final"}</p>
                  {next.address && (
                    <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" /> {next.address}
                    </p>
                  )}
                  <p className="mt-1 text-[13px] text-muted-foreground">{next.items.length} itens</p>
                </div>
                <Button size="lg" className="w-full">
                  {next.status === "PENDING" ? "Iniciar entrega" : "Continuar entrega"} <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <EmptyState icon={Truck} title="Nenhuma entrega pendente" description="Novas entregas atribuídas a você aparecerão aqui." />
        )}

        {pending.length > 1 && (
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground">Depois</p>
            {pending.slice(1).map((d) => (
              <Link key={d.id} href={`/dashboard/deliveries/${d.id}`}>
                <Card className="transition-colors hover:border-primary/25">
                  <CardContent className="flex items-center justify-between gap-3 pt-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.customer?.name ?? "Consumidor final"}</p>
                      <p className="truncate text-[12.5px] text-muted-foreground">{d.address ?? "Sem endereço"}</p>
                    </div>
                    <StatusBadge {...deliveryStatus(d.status)} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {done.length > 0 && (
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground">Concluídas</p>
            {done.map((d) => (
              <Link key={d.id} href={`/dashboard/deliveries/${d.id}`}>
                <Card className="opacity-70 transition-colors hover:opacity-100">
                  <CardContent className="flex items-center justify-between gap-3 pt-4">
                    <p className="truncate font-medium">{d.customer?.name ?? "Consumidor final"}</p>
                    <StatusBadge {...deliveryStatus(d.status)} />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Entregas" description={`${deliveries.length} entregas registradas`} />
      {deliveries.length === 0 ? (
        <EmptyState icon={Truck} title="Nenhuma entrega encontrada" description="Entregas vinculadas a vendas aparecerão aqui." />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {deliveries.map((d) => {
            const status = deliveryStatus(d.status);
            return (
              <Link key={d.id} href={`/dashboard/deliveries/${d.id}`}>
                <Card className="transition-colors hover:border-primary/25">
                  <CardContent className="space-y-2 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{d.customer?.name ?? "Consumidor final"}</p>
                      <StatusBadge {...status} />
                    </div>
                    <p className="text-[12.5px] text-muted-foreground">{d.driver?.name ?? "Sem motorista atribuído"}</p>
                    <p className="text-[12.5px] text-muted-foreground">{formatDate(d.createdAt)} · {d.items.length} itens</p>
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

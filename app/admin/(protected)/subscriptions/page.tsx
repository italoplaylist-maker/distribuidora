import { listSubscriptionsAdmin } from "@/features/admin/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { subscriptionStatus } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminSubscriptionsPage() {
  const subscriptions = await listSubscriptionsAdmin();

  return (
    <div className="space-y-5">
      <PageHeader title="Assinaturas" description={`${subscriptions.length} assinaturas na plataforma`} />

      <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        {subscriptions.map((s) => {
          const status = subscriptionStatus(s.status);
          const price = s.billingCycle === "yearly" ? s.plan.priceYearly : s.plan.priceMonthly;
          return (
            <Card key={s.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate font-medium">{s.company.nomeFantasia}</p>
                  <StatusBadge {...status} />
                </div>
                <p className="text-[12.5px] text-muted-foreground">
                  {s.plan.name} · {formatCurrency(price.toString())} · {s.billingCycle === "yearly" ? "Anual" : "Mensal"}
                </p>
                <p className="text-[12.5px] text-muted-foreground">Próxima cobrança em {formatDate(s.currentPeriodEnd)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próxima cobrança</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((s) => {
              const status = subscriptionStatus(s.status);
              const price = s.billingCycle === "yearly" ? s.plan.priceYearly : s.plan.priceMonthly;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.company.nomeFantasia}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.plan.name} · {formatCurrency(price.toString())}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.billingCycle === "yearly" ? "Anual" : "Mensal"}</TableCell>
                  <TableCell>
                    <StatusBadge {...status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(s.currentPeriodEnd)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

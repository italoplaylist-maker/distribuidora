import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { prisma } from "@/lib/database/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { SubscribeButton } from "@/features/billing/subscribe-button";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  TRIAL: { label: "Período de teste", variant: "warning" },
  ACTIVE: { label: "Ativo", variant: "success" },
  PAST_DUE: { label: "Pagamento pendente", variant: "warning" },
  SUSPENDED: { label: "Suspenso", variant: "destructive" },
  CANCELED: { label: "Cancelado", variant: "secondary" },
};

export default async function BillingPage() {
  const tenant = await getCurrentTenant();
  const [plans, currentSub, usage] = await Promise.all([
    prisma.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.subscription.findUnique({ where: { companyId: tenant.companyId }, include: { plan: true } }),
    Promise.all([
      prisma.user.count({ where: { companyId: tenant.companyId, active: true } }),
      prisma.product.count({ where: { companyId: tenant.companyId, active: true } }),
      prisma.customer.count({ where: { companyId: tenant.companyId, active: true } }),
    ]),
  ]);

  const [userCount, productCount, customerCount] = usage;
  const statusInfo = STATUS_LABELS[tenant.company.status];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">Plano e assinatura</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{currentSub?.plan.name ?? "Sem plano"}</CardTitle>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          <CardDescription>
            {tenant.company.status === "TRIAL"
              ? `Teste termina em ${formatDate(tenant.company.trialEndsAt)}`
              : currentSub
                ? `Próxima cobrança em ${formatDate(currentSub.currentPeriodEnd)}`
                : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Usuários</p>
            <p className="font-semibold">
              {userCount} / {currentSub && currentSub.plan.maxUsers < 0 ? "∞" : currentSub?.plan.maxUsers}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Produtos</p>
            <p className="font-semibold">
              {productCount} / {currentSub && currentSub.plan.maxProducts < 0 ? "∞" : currentSub?.plan.maxProducts}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Clientes</p>
            <p className="font-semibold">
              {customerCount} / {currentSub && currentSub.plan.maxCustomers < 0 ? "∞" : currentSub?.plan.maxCustomers}
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="mb-3 font-semibold">Planos disponíveis</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentSub?.planId === plan.id && tenant.company.status === "ACTIVE";
            return (
              <Card key={plan.id} className={cn(isCurrent && "border-primary ring-1 ring-primary")}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">
                    {formatCurrency(plan.priceMonthly.toString())}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>{plan.maxUsers < 0 ? "Usuários ilimitados" : `${plan.maxUsers} usuários`}</li>
                    <li>{plan.maxProducts < 0 ? "Produtos ilimitados" : `${plan.maxProducts} produtos`}</li>
                    <li>{plan.maxCustomers < 0 ? "Clientes ilimitados" : `${plan.maxCustomers} clientes`}</li>
                  </ul>
                  {isCurrent ? (
                    <Badge variant="success">Plano atual</Badge>
                  ) : (
                    <SubscribeButton planId={plan.id} billingCycle="monthly" label={tenant.company.status === "TRIAL" ? "Assinar" : "Fazer upgrade"} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { prisma } from "@/lib/database/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { companyStatus } from "@/lib/status";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { SubscribeButton } from "@/features/billing/subscribe-button";

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
  const status = companyStatus(tenant.company.status);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Plano e assinatura" />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{currentSub?.plan.name ?? "Sem plano"}</CardTitle>
            <StatusBadge {...status} />
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
        <p className="mb-3 text-[14px] font-semibold">Planos disponíveis</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentSub?.planId === plan.id && tenant.company.status === "ACTIVE";
            return (
              <Card key={plan.id} className={cn(isCurrent && "border-primary/60 ring-1 ring-primary/30")}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-[26px] font-semibold tracking-[-0.02em]">
                    {formatCurrency(plan.priceMonthly.toString())}
                    <span className="text-[13.5px] font-normal text-muted-foreground">/mês</span>
                  </p>
                  <ul className="space-y-1 text-[13.5px] text-muted-foreground">
                    <li>{plan.maxUsers < 0 ? "Usuários ilimitados" : `${plan.maxUsers} usuários`}</li>
                    <li>{plan.maxProducts < 0 ? "Produtos ilimitados" : `${plan.maxProducts} produtos`}</li>
                    <li>{plan.maxCustomers < 0 ? "Clientes ilimitados" : `${plan.maxCustomers} clientes`}</li>
                  </ul>
                  {isCurrent ? (
                    <StatusBadge label="Plano atual" tone="success" />
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

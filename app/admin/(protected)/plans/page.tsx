import { Star } from "lucide-react";
import { listPlansAdmin } from "@/features/admin/queries";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { planStatus } from "@/lib/status";
import { cn, formatCurrency } from "@/lib/utils";
import { PlanFormDialog } from "@/features/admin/plan-form-dialog";
import { TogglePlanButton } from "@/features/admin/toggle-plan-button";

export default async function AdminPlansPage() {
  const plans = await listPlansAdmin();
  const mostSubscribed = plans.reduce((best, p) => (p._count.subscriptions > (best?._count.subscriptions ?? -1) ? p : best), plans[0]);

  return (
    <div className="space-y-5">
      <PageHeader title="Planos" action={<PlanFormDialog />} />

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const recommended = plan.active && plans.length > 1 && plan.id === mostSubscribed?.id && plan._count.subscriptions > 0;
          return (
            <Card key={plan.id} className={cn("relative", recommended && "border-primary/60 ring-1 ring-primary/30")}>
              {recommended && (
                <span className="absolute -top-3 left-5 flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                  <Star className="size-3 fill-current" /> Mais assinado
                </span>
              )}
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{plan.name}</p>
                  <StatusBadge {...planStatus(plan.active)} />
                </div>
                <p className="text-[26px] font-semibold tracking-[-0.02em]">
                  {formatCurrency(plan.priceMonthly.toString())}
                  <span className="text-[13.5px] font-normal text-muted-foreground">/mês</span>
                </p>
                <ul className="space-y-1 text-[13.5px] text-muted-foreground">
                  <li>{plan.maxUsers < 0 ? "Usuários ilimitados" : `${plan.maxUsers} usuários`}</li>
                  <li>{plan.maxProducts < 0 ? "Produtos ilimitados" : `${plan.maxProducts} produtos`}</li>
                  <li>{plan.maxCustomers < 0 ? "Clientes ilimitados" : `${plan.maxCustomers} clientes`}</li>
                  <li>{plan._count.subscriptions} empresas assinantes</li>
                </ul>
                <div className="flex gap-2">
                  <PlanFormDialog
                    plan={{
                      id: plan.id,
                      name: plan.name,
                      slug: plan.slug,
                      description: plan.description ?? "",
                      priceMonthly: plan.priceMonthly.toNumber(),
                      priceYearly: plan.priceYearly.toNumber(),
                      maxUsers: plan.maxUsers,
                      maxProducts: plan.maxProducts,
                      maxCustomers: plan.maxCustomers,
                      maxSuppliers: plan.maxSuppliers,
                      maxStorageMb: plan.maxStorageMb,
                      features: plan.features,
                      active: plan.active,
                    }}
                  />
                  <TogglePlanButton planId={plan.id} active={plan.active} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

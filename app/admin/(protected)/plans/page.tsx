import { listPlansAdmin } from "@/features/admin/queries";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { PlanFormDialog } from "@/features/admin/plan-form-dialog";
import { TogglePlanButton } from "@/features/admin/toggle-plan-button";

export default async function AdminPlansPage() {
  const plans = await listPlansAdmin();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Planos</h1>
        <PlanFormDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-zinc-800 bg-[#111315] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{plan.name}</p>
              <Badge variant={plan.active ? "success" : "secondary"}>{plan.active ? "Ativo" : "Inativo"}</Badge>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(plan.priceMonthly.toString())}
              <span className="text-sm font-normal text-zinc-500">/mês</span>
            </p>
            <ul className="space-y-1 text-sm text-zinc-400">
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
          </div>
        ))}
      </div>
    </div>
  );
}

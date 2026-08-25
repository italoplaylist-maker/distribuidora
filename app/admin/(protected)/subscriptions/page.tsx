import { listSubscriptionsAdmin } from "@/features/admin/queries";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_INFO: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  TRIALING: { label: "Trial", variant: "warning" },
  ACTIVE: { label: "Ativa", variant: "success" },
  PAST_DUE: { label: "Inadimplente", variant: "warning" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
};

export default async function AdminSubscriptionsPage() {
  const subscriptions = await listSubscriptionsAdmin();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Assinaturas</h1>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-xs uppercase text-zinc-500">
            <tr>
              <th className="p-3 text-left">Empresa</th>
              <th className="p-3 text-left">Plano</th>
              <th className="p-3 text-left">Ciclo</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Próxima cobrança</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr key={s.id} className="border-t border-zinc-800">
                <td className="p-3 font-medium text-zinc-100">{s.company.nomeFantasia}</td>
                <td className="p-3 text-zinc-400">
                  {s.plan.name} · {formatCurrency(s.billingCycle === "yearly" ? s.plan.priceYearly.toString() : s.plan.priceMonthly.toString())}
                </td>
                <td className="p-3 text-zinc-400">{s.billingCycle === "yearly" ? "Anual" : "Mensal"}</td>
                <td className="p-3">
                  <Badge variant={STATUS_INFO[s.status].variant}>{STATUS_INFO[s.status].label}</Badge>
                </td>
                <td className="p-3 text-zinc-400">{formatDate(s.currentPeriodEnd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

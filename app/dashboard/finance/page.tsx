import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getFinanceSummary, getOpenCashRegister } from "@/features/finance/queries";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function FinancePage() {
  const tenant = await getCurrentTenant();
  const [summary, cashRegister] = await Promise.all([getFinanceSummary(tenant.companyId), getOpenCashRegister(tenant.companyId)]);

  const cards = [
    { href: "/dashboard/finance/receivables", label: "Contas a receber", value: formatCurrency(summary.receivablesOpen), icon: ArrowDownCircle },
    { href: "/dashboard/finance/payables", label: "Contas a pagar", value: formatCurrency(summary.payablesOpen), icon: ArrowUpCircle },
    {
      href: "/dashboard/finance/cash",
      label: "Caixa",
      value: cashRegister ? formatCurrency(cashRegister.expectedBalance.toString()) : "Fechado",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Financeiro</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="transition-colors hover:bg-muted">
              <CardContent className="flex items-center gap-4 pt-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                  <c.icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-lg font-bold">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getOpenCashRegister, getCashRegisterHistory } from "@/features/finance/queries";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ActivityTimeline, type ActivityItem } from "@/components/activity-timeline";
import { CASH_MOVEMENT_LABELS } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OpenCashButton, CloseCashButton, CashMovementButton } from "@/features/finance/cash-controls";

export default async function CashPage() {
  const tenant = await getCurrentTenant();
  const [cashRegister, history] = await Promise.all([getOpenCashRegister(tenant.companyId), getCashRegisterHistory(tenant.companyId)]);

  const movementActivity: ActivityItem[] =
    cashRegister?.movements.map((m) => ({
      id: m.id,
      icon: Number(m.amount) < 0 ? ArrowUpCircle : ArrowDownCircle,
      tone: Number(m.amount) < 0 ? "destructive" : "success",
      title: CASH_MOVEMENT_LABELS[m.type] ?? m.type,
      subtitle: m.description ?? "",
      amount: Math.abs(Number(m.amount)),
      amountTone: Number(m.amount) < 0 ? "negative" : undefined,
      time: formatDate(m.createdAt),
    })) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Caixa"
        description={cashRegister ? "Caixa aberto no momento" : "Nenhum caixa aberto"}
        action={
          cashRegister ? (
            <div className="flex flex-wrap gap-2">
              <CashMovementButton />
              <CloseCashButton cashRegisterId={cashRegister.id} expectedBalance={Number(cashRegister.expectedBalance)} />
            </div>
          ) : (
            <OpenCashButton />
          )
        }
      />

      {cashRegister ? (
        <>
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-6">
              <div>
                <p className="text-[12.5px] text-muted-foreground">Aberto por</p>
                <p className="font-medium">{cashRegister.user.name}</p>
              </div>
              <div>
                <p className="text-[12.5px] text-muted-foreground">Desde</p>
                <p className="font-medium">{formatDate(cashRegister.openedAt)}</p>
              </div>
              <div>
                <p className="text-[12.5px] text-muted-foreground">Saldo inicial</p>
                <p className="font-medium">{formatCurrency(cashRegister.openingBalance.toString())}</p>
              </div>
              <div>
                <p className="text-[12.5px] text-muted-foreground">Saldo esperado</p>
                <p className="text-[19px] font-semibold text-primary">{formatCurrency(cashRegister.expectedBalance.toString())}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-1 text-[14px] font-semibold">Movimentações</p>
              <ActivityTimeline items={movementActivity} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-[13.5px] text-muted-foreground">Nenhum caixa aberto no momento.</CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-[14px] font-semibold">Histórico de fechamentos</p>
            <div className="divide-y divide-border/60">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                  <div>
                    <p className="font-medium">{h.closedAt ? formatDate(h.closedAt) : "-"}</p>
                    <p className="text-[12.5px] text-muted-foreground">{h.user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(h.informedBalance?.toString() ?? "0")}</p>
                    {h.difference && Number(h.difference) !== 0 && (
                      <p className={Number(h.difference) < 0 ? "text-[12.5px] text-destructive" : "text-[12.5px] text-success"}>
                        Diferença: {Number(h.difference) > 0 ? "+" : ""}
                        {formatCurrency(h.difference.toString())}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

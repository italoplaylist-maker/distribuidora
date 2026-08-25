import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getOpenCashRegister, getCashRegisterHistory } from "@/features/finance/queries";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OpenCashButton, CloseCashButton, CashMovementButton } from "@/features/finance/cash-controls";

const MOVEMENT_LABELS: Record<string, string> = {
  ABERTURA: "Abertura",
  VENDA: "Venda",
  RECEBIMENTO: "Recebimento",
  DESPESA: "Despesa",
  SANGRIA: "Sangria",
  SUPRIMENTO: "Suprimento",
};

export default async function CashPage() {
  const tenant = await getCurrentTenant();
  const [cashRegister, history] = await Promise.all([getOpenCashRegister(tenant.companyId), getCashRegisterHistory(tenant.companyId)]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Caixa</h1>
        {cashRegister ? (
          <div className="flex gap-2">
            <CashMovementButton />
            <CloseCashButton cashRegisterId={cashRegister.id} expectedBalance={Number(cashRegister.expectedBalance)} />
          </div>
        ) : (
          <OpenCashButton />
        )}
      </div>

      {cashRegister ? (
        <>
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-5">
              <div>
                <p className="text-xs text-muted-foreground">Aberto por</p>
                <p className="font-medium">{cashRegister.user.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Desde</p>
                <p className="font-medium">{formatDate(cashRegister.openedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo inicial</p>
                <p className="font-medium">{formatCurrency(cashRegister.openingBalance.toString())}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo esperado</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(cashRegister.expectedBalance.toString())}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <p className="mb-3 font-semibold">Movimentações</p>
              <div className="divide-y divide-border">
                {cashRegister.movements.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{MOVEMENT_LABELS[m.type] ?? m.type}</p>
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    </div>
                    <p className={Number(m.amount) < 0 ? "font-semibold text-destructive" : "font-semibold text-success"}>
                      {Number(m.amount) > 0 ? "+" : ""}
                      {formatCurrency(m.amount.toString())}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-5 text-center text-sm text-muted-foreground">Nenhum caixa aberto no momento.</CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 font-semibold">Histórico de fechamentos</p>
            <div className="divide-y divide-border">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{h.closedAt ? formatDate(h.closedAt) : "-"}</p>
                    <p className="text-xs text-muted-foreground">{h.user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(h.informedBalance?.toString() ?? "0")}</p>
                    {h.difference && Number(h.difference) !== 0 && (
                      <p className={Number(h.difference) < 0 ? "text-xs text-destructive" : "text-xs text-success"}>
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

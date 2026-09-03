import { Receipt, AlertCircle, Clock, CalendarClock, Wallet } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listPayables } from "@/features/finance/queries";
import { groupByDueDate, summarizeByDueDate } from "@/features/finance/due-date-groups";
import { AccountGroups, SettledAccountsTable, type AccountRow } from "@/features/finance/account-groups";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { formatCurrency } from "@/lib/utils";
import { payPayableAction } from "@/features/finance/actions";

export default async function PayablesPage() {
  const tenant = await getCurrentTenant();
  const { open, settled } = await listPayables(tenant.companyId);

  const openRows: AccountRow[] = open.map((p) => ({
    id: p.id,
    partyName: p.purchase?.supplier.name ?? "-",
    description: p.description,
    dueDate: p.dueDate,
    status: p.status,
    remaining: Number(p.amount) - Number(p.paidAmount),
  }));
  const settledRows: AccountRow[] = settled.map((p) => ({
    id: p.id,
    partyName: p.purchase?.supplier.name ?? "-",
    description: p.description,
    dueDate: p.dueDate,
    status: p.status,
    remaining: Number(p.amount) - Number(p.paidAmount),
  }));

  const summary = summarizeByDueDate(openRows, (r) => r.dueDate, (r) => r.remaining);
  const groups = groupByDueDate(openRows, (r) => r.dueDate);

  return (
    <div className="space-y-5">
      <PageHeader title="Contas a pagar" description={`${open.length} conta${open.length === 1 ? "" : "s"} em aberto`} />

      {open.length === 0 && settled.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhuma conta a pagar" description="Compras a prazo aparecerão aqui." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Em aberto" value={formatCurrency(summary.total)} icon={<Wallet />} accent="primary" index={0} />
            <MetricCard
              label="Vencido"
              value={formatCurrency(summary.overdue)}
              icon={<AlertCircle />}
              accent={summary.overdue > 0 ? "destructive" : "neutral"}
              index={1}
            />
            <MetricCard label="Vence em 7 dias" value={formatCurrency(summary.dueIn7)} icon={<Clock />} accent="warning" index={2} />
            <MetricCard label="Vence em 30 dias" value={formatCurrency(summary.dueIn30)} icon={<CalendarClock />} accent="neutral" index={3} />
          </div>

          {open.length === 0 ? (
            <EmptyState icon={Receipt} title="Nenhuma conta em aberto" description="Todas as contas a pagar estão quitadas." />
          ) : (
            <AccountGroups groups={groups} partyLabel="Fornecedor" actionLabel="Pagar" action={payPayableAction} />
          )}

          <SettledAccountsTable rows={settledRows} partyLabel="Fornecedor" />
        </>
      )}
    </div>
  );
}

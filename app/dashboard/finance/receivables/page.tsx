import { HandCoins, AlertCircle, Clock, CalendarClock, Wallet } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listReceivables } from "@/features/finance/queries";
import { groupByDueDate, summarizeByDueDate } from "@/features/finance/due-date-groups";
import { AccountGroups, SettledAccountsTable, type AccountRow } from "@/features/finance/account-groups";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { formatCurrency } from "@/lib/utils";
import { payReceivableAction } from "@/features/finance/actions";

export default async function ReceivablesPage() {
  const tenant = await getCurrentTenant();
  const { open, settled } = await listReceivables(tenant.companyId);

  const openRows: AccountRow[] = open.map((r) => ({
    id: r.id,
    partyName: r.customer.name,
    description: r.description,
    dueDate: r.dueDate,
    status: r.status,
    remaining: Number(r.amount) - Number(r.paidAmount),
  }));
  const settledRows: AccountRow[] = settled.map((r) => ({
    id: r.id,
    partyName: r.customer.name,
    description: r.description,
    dueDate: r.dueDate,
    status: r.status,
    remaining: Number(r.amount) - Number(r.paidAmount),
  }));

  const summary = summarizeByDueDate(openRows, (r) => r.dueDate, (r) => r.remaining);
  const groups = groupByDueDate(openRows, (r) => r.dueDate);

  return (
    <div className="space-y-5">
      <PageHeader title="Contas a receber" description={`${open.length} conta${open.length === 1 ? "" : "s"} em aberto`} />

      {open.length === 0 && settled.length === 0 ? (
        <EmptyState icon={HandCoins} title="Nenhuma conta a receber" description="Vendas fiado aparecerão aqui." />
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
            <EmptyState icon={HandCoins} title="Nenhuma conta em aberto" description="Todas as contas a receber estão quitadas." />
          ) : (
            <AccountGroups groups={groups} partyLabel="Cliente" actionLabel="Receber" action={payReceivableAction} />
          )}

          <SettledAccountsTable rows={settledRows} partyLabel="Cliente" />
        </>
      )}
    </div>
  );
}

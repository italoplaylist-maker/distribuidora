import { HandCoins } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listReceivables } from "@/features/finance/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { accountStatus } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PayDialog } from "@/features/finance/pay-dialog";
import { payReceivableAction } from "@/features/finance/actions";

export default async function ReceivablesPage() {
  const tenant = await getCurrentTenant();
  const receivables = await listReceivables(tenant.companyId);

  return (
    <div className="space-y-5">
      <PageHeader title="Contas a receber" description={`${receivables.length} contas registradas`} />

      {receivables.length === 0 ? (
        <EmptyState icon={HandCoins} title="Nenhuma conta a receber" description="Vendas fiado aparecerão aqui." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {receivables.map((r) => {
              const remaining = Number(r.amount) - Number(r.paidAmount);
              const status = accountStatus(r.status, r.dueDate);
              return (
                <Card key={r.id}>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.customer.name}</p>
                        <p className="truncate text-[12.5px] text-muted-foreground">{r.description}</p>
                        <p className="text-[12.5px] text-muted-foreground">Vence em {formatDate(r.dueDate)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold">{formatCurrency(remaining)}</p>
                        <StatusBadge {...status} className="mt-1" />
                      </div>
                    </div>
                    {(r.status === "OPEN" || r.status === "PARTIALLY_PAID") && (
                      <PayDialog id={r.id} remaining={remaining} label="Receber" action={payReceivableAction} />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map((r) => {
                  const remaining = Number(r.amount) - Number(r.paidAmount);
                  const status = accountStatus(r.status, r.dueDate);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.customer.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.description}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(r.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(remaining)}</TableCell>
                      <TableCell>
                        <StatusBadge {...status} />
                      </TableCell>
                      <TableCell>
                        {(r.status === "OPEN" || r.status === "PARTIALLY_PAID") && (
                          <PayDialog id={r.id} remaining={remaining} label="Receber" action={payReceivableAction} />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

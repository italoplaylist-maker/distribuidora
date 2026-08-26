import { Receipt } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listPayables } from "@/features/finance/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { accountStatus } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PayDialog } from "@/features/finance/pay-dialog";
import { payPayableAction } from "@/features/finance/actions";

export default async function PayablesPage() {
  const tenant = await getCurrentTenant();
  const payables = await listPayables(tenant.companyId);

  return (
    <div className="space-y-5">
      <PageHeader title="Contas a pagar" description={`${payables.length} contas registradas`} />

      {payables.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhuma conta a pagar" description="Compras a prazo aparecerão aqui." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {payables.map((p) => {
              const remaining = Number(p.amount) - Number(p.paidAmount);
              const status = accountStatus(p.status, p.dueDate);
              return (
                <Card key={p.id}>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.purchase?.supplier.name ?? "-"}</p>
                        <p className="truncate text-[12.5px] text-muted-foreground">{p.description}</p>
                        <p className="text-[12.5px] text-muted-foreground">Vence em {formatDate(p.dueDate)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold">{formatCurrency(remaining)}</p>
                        <StatusBadge {...status} className="mt-1" />
                      </div>
                    </div>
                    {(p.status === "OPEN" || p.status === "PARTIALLY_PAID") && (
                      <PayDialog id={p.id} remaining={remaining} label="Pagar" action={payPayableAction} />
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
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.map((p) => {
                  const remaining = Number(p.amount) - Number(p.paidAmount);
                  const status = accountStatus(p.status, p.dueDate);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.purchase?.supplier.name ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.description}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(remaining)}</TableCell>
                      <TableCell>
                        <StatusBadge {...status} />
                      </TableCell>
                      <TableCell>
                        {(p.status === "OPEN" || p.status === "PARTIALLY_PAID") && (
                          <PayDialog id={p.id} remaining={remaining} label="Pagar" action={payPayableAction} />
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

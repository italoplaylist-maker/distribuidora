import { HandCoins } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listReceivables } from "@/features/finance/queries";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PayDialog } from "@/features/finance/pay-dialog";
import { payReceivableAction } from "@/features/finance/actions";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  OPEN: { label: "Em aberto", variant: "warning" },
  PARTIALLY_PAID: { label: "Parcial", variant: "warning" },
  PAID: { label: "Recebido", variant: "success" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
};

export default async function ReceivablesPage() {
  const tenant = await getCurrentTenant();
  const receivables = await listReceivables(tenant.companyId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Contas a receber</h1>
      {receivables.length === 0 ? (
        <EmptyState icon={HandCoins} title="Nenhuma conta a receber" description="Vendas fiado aparecerão aqui." />
      ) : (
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
              const overdue = r.status !== "PAID" && r.status !== "CANCELED" && new Date(r.dueDate) < new Date();
              const statusInfo = STATUS_LABELS[overdue ? "OVERDUE" : r.status];
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.customer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.description}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(remaining)}</TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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
      )}
    </div>
  );
}

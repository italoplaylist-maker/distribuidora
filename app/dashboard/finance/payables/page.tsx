import { Receipt } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listPayables } from "@/features/finance/queries";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PayDialog } from "@/features/finance/pay-dialog";
import { payPayableAction } from "@/features/finance/actions";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
  OPEN: { label: "Em aberto", variant: "warning" },
  PARTIALLY_PAID: { label: "Parcial", variant: "warning" },
  PAID: { label: "Pago", variant: "success" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
  OVERDUE: { label: "Vencida", variant: "destructive" },
};

export default async function PayablesPage() {
  const tenant = await getCurrentTenant();
  const payables = await listPayables(tenant.companyId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Contas a pagar</h1>
      {payables.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhuma conta a pagar" description="Compras a prazo aparecerão aqui." />
      ) : (
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
              const overdue = p.status !== "PAID" && p.status !== "CANCELED" && new Date(p.dueDate) < new Date();
              const statusInfo = STATUS_LABELS[overdue ? "OVERDUE" : p.status];
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.purchase?.supplier.name ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.description}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(remaining)}</TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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
      )}
    </div>
  );
}

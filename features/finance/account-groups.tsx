import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { accountStatus } from "@/lib/status";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PayDialog } from "@/features/finance/pay-dialog";
import type { DueDateGroup } from "@/features/finance/due-date-groups";

export interface AccountRow {
  id: string;
  partyName: string;
  description: string;
  dueDate: Date;
  status: string;
  remaining: number;
}

type PayAction = (input: { id: string; amount: number }) => Promise<{ success: boolean; error?: string }>;

export function AccountGroups({
  groups,
  partyLabel,
  actionLabel,
  action,
}: {
  groups: DueDateGroup<AccountRow>[];
  partyLabel: string;
  actionLabel: string;
  action: PayAction;
}) {
  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const groupTotal = group.items.reduce((sum, r) => sum + r.remaining, 0);
        return (
          <div key={group.key} className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h3 className={cn("text-[13px] font-semibold", group.key === "overdue" && "text-destructive")}>{group.label}</h3>
              <span className="text-[12.5px] text-muted-foreground">
                {group.items.length} · {formatCurrency(groupTotal)}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 lg:hidden">
              {group.items.map((r) => {
                const status = accountStatus(r.status, r.dueDate);
                return (
                  <Card key={r.id}>
                    <CardContent className="space-y-3 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.partyName}</p>
                          <p className="truncate text-[12.5px] text-muted-foreground">{r.description}</p>
                          <p className="text-[12.5px] text-muted-foreground">Vence em {formatDate(r.dueDate)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-semibold">{formatCurrency(r.remaining)}</p>
                          <StatusBadge {...status} className="mt-1" />
                        </div>
                      </div>
                      <PayDialog id={r.id} remaining={r.remaining} label={actionLabel} action={action} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{partyLabel}</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((r) => {
                    const status = accountStatus(r.status, r.dueDate);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.partyName}</TableCell>
                        <TableCell className="text-muted-foreground">{r.description}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(r.dueDate)}</TableCell>
                        <TableCell>{formatCurrency(r.remaining)}</TableCell>
                        <TableCell>
                          <StatusBadge {...status} />
                        </TableCell>
                        <TableCell>
                          <PayDialog id={r.id} remaining={r.remaining} label={actionLabel} action={action} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SettledAccountsTable({ rows, partyLabel }: { rows: AccountRow[]; partyLabel: string }) {
  if (rows.length === 0) return null;
  return (
    <details className="group rounded-lg border border-border/60 bg-card open:pb-2">
      <summary className="cursor-pointer select-none px-5 py-4 text-[13px] font-semibold text-muted-foreground">
        Histórico ({rows.length}) — pagas e canceladas recentes
      </summary>
      <div className="px-2 pb-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{partyLabel}</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const status = accountStatus(r.status, r.dueDate);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.partyName}</TableCell>
                  <TableCell className="text-muted-foreground">{r.description}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(r.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(r.remaining)}</TableCell>
                  <TableCell>
                    <StatusBadge {...status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </details>
  );
}

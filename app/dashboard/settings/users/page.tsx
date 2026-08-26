import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { prisma } from "@/lib/database/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { ROLE_LABELS, userStatus } from "@/lib/status";
import { CreateUserDialog } from "@/features/users/create-user-dialog";
import { ToggleActiveButton } from "@/features/users/toggle-active-button";

export default async function UsersSettingsPage() {
  const tenant = await getCurrentTenant();
  const [users, subscription] = await Promise.all([
    prisma.user.findMany({ where: { companyId: tenant.companyId }, orderBy: { createdAt: "asc" } }),
    prisma.subscription.findUnique({ where: { companyId: tenant.companyId }, include: { plan: true } }),
  ]);

  const limit = subscription?.plan.maxUsers ?? 0;
  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuários"
        description={`${activeCount} / ${limit < 0 ? "ilimitado" : limit} usuários ativos`}
        action={<CreateUserDialog />}
      />

      <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        {users.map((u) => {
          const status = userStatus(u.active);
          return (
            <Card key={u.id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.name}</p>
                    <p className="truncate text-[12.5px] text-muted-foreground">{u.email}</p>
                    <p className="text-[12.5px] text-muted-foreground">{u.role ? ROLE_LABELS[u.role] : "-"}</p>
                  </div>
                  <StatusBadge {...status} />
                </div>
                <ToggleActiveButton userId={u.id} active={u.active} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const status = userStatus(u.active);
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.role ? ROLE_LABELS[u.role] : "-"}</TableCell>
                  <TableCell>
                    <StatusBadge {...status} />
                  </TableCell>
                  <TableCell>
                    <ToggleActiveButton userId={u.id} active={u.active} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

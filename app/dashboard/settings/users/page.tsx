import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { prisma } from "@/lib/database/prisma";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateUserDialog } from "@/features/users/create-user-dialog";
import { ToggleActiveButton } from "@/features/users/toggle-active-button";

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  GERENTE: "Gerente",
  VENDEDOR: "Vendedor",
  ESTOQUISTA: "Estoquista",
  FINANCEIRO: "Financeiro",
  MOTORISTA: "Motorista",
};

export default async function UsersSettingsPage() {
  const tenant = await getCurrentTenant();
  const [users, subscription] = await Promise.all([
    prisma.user.findMany({ where: { companyId: tenant.companyId }, orderBy: { createdAt: "asc" } }),
    prisma.subscription.findUnique({ where: { companyId: tenant.companyId }, include: { plan: true } }),
  ]);

  const limit = subscription?.plan.maxUsers ?? 0;
  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} / {limit < 0 ? "ilimitado" : limit} usuários ativos
          </p>
        </div>
        <CreateUserDialog />
      </div>

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
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell className="text-muted-foreground">{u.role ? ROLE_LABELS[u.role] : "-"}</TableCell>
              <TableCell>
                <Badge variant={u.active ? "success" : "secondary"}>{u.active ? "Ativo" : "Inativo"}</Badge>
              </TableCell>
              <TableCell>
                <ToggleActiveButton userId={u.id} active={u.active} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

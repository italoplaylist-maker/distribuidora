import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listCustomers } from "@/features/customers/queries";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { EntitySearch } from "@/components/entity-search";
import { formatCurrency } from "@/lib/utils";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const tenant = await getCurrentTenant();
  const customers = await listCustomers(tenant.companyId, q);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{customers.length} clientes cadastrados</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/customers/new">
            <UserPlus className="size-4" /> Novo cliente
          </Link>
        </Button>
      </div>

      <EntitySearch defaultValue={q} placeholder="Buscar por nome, CPF/CNPJ ou telefone" />

      {customers.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente encontrado" description="Cadastre seu primeiro cliente." actionLabel="Novo cliente" actionHref="/dashboard/customers/new" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Limite de crédito</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/dashboard/customers/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">{c.document ?? "-"}</TableCell>
                <TableCell>{formatCurrency(c.creditLimit.toString())}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

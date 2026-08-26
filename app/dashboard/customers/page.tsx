import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listCustomers } from "@/features/customers/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { EntitySearch } from "@/components/entity-search";
import { PageHeader } from "@/components/page-header";
import { formatCurrency } from "@/lib/utils";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const tenant = await getCurrentTenant();
  const customers = await listCustomers(tenant.companyId, q);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description={`${customers.length} clientes cadastrados`}
        action={
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <UserPlus className="size-4" /> Novo cliente
            </Link>
          </Button>
        }
      />

      <EntitySearch defaultValue={q} placeholder="Buscar por nome, CPF/CNPJ ou telefone" />

      {customers.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum cliente encontrado" description="Cadastre seu primeiro cliente." actionLabel="Novo cliente" actionHref="/dashboard/customers/new" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {customers.map((c) => (
              <Link key={c.id} href={`/dashboard/customers/${c.id}`}>
                <Card className="transition-colors hover:border-primary/25">
                  <CardContent className="flex items-center gap-3 pt-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[14px] font-semibold text-foreground">
                      {c.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-[12.5px] text-muted-foreground">{c.phone ?? c.document ?? "Sem contato"}</p>
                    </div>
                    <p className="shrink-0 text-[13px] font-medium text-muted-foreground">{formatCurrency(c.creditLimit.toString())}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="hidden lg:block">
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
          </div>
        </>
      )}
    </div>
  );
}

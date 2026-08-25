import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listSuppliers } from "@/features/suppliers/queries";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { EntitySearch } from "@/components/entity-search";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const tenant = await getCurrentTenant();
  const suppliers = await listSuppliers(tenant.companyId, q);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} fornecedores cadastrados</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/suppliers/new">
            <Plus className="size-4" /> Novo fornecedor
          </Link>
        </Button>
      </div>

      <EntitySearch defaultValue={q} placeholder="Buscar por nome ou documento" />

      {suppliers.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhum fornecedor encontrado" description="Cadastre seu primeiro fornecedor." actionLabel="Novo fornecedor" actionHref="/dashboard/suppliers/new" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Documento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Link href={`/dashboard/suppliers/${s.id}`} className="font-medium hover:underline">
                    {s.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.phone ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">{s.email ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">{s.document ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

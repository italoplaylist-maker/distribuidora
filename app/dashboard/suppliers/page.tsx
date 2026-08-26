import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listSuppliers } from "@/features/suppliers/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { EntitySearch } from "@/components/entity-search";
import { PageHeader } from "@/components/page-header";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const tenant = await getCurrentTenant();
  const suppliers = await listSuppliers(tenant.companyId, q);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fornecedores"
        description={`${suppliers.length} fornecedores cadastrados`}
        action={
          <Button asChild>
            <Link href="/dashboard/suppliers/new">
              <Plus className="size-4" /> Novo fornecedor
            </Link>
          </Button>
        }
      />

      <EntitySearch defaultValue={q} placeholder="Buscar por nome ou documento" />

      {suppliers.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhum fornecedor encontrado" description="Cadastre seu primeiro fornecedor." actionLabel="Novo fornecedor" actionHref="/dashboard/suppliers/new" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {suppliers.map((s) => (
              <Link key={s.id} href={`/dashboard/suppliers/${s.id}`}>
                <Card className="transition-colors hover:border-primary/25">
                  <CardContent className="flex items-center gap-3 pt-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[14px] font-semibold text-foreground">
                      {s.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="truncate text-[12.5px] text-muted-foreground">{s.phone ?? s.email ?? s.document ?? "Sem contato"}</p>
                    </div>
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
          </div>
        </>
      )}
    </div>
  );
}

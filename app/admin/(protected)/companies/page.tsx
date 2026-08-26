import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { listCompaniesAdmin } from "@/features/admin/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { companyStatus } from "@/lib/status";
import { formatDate } from "@/lib/utils";

export default async function AdminCompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const companies = await listCompaniesAdmin(q);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Empresas"
        description={`${companies.length} empresas cadastradas na plataforma`}
        action={
          <Button asChild>
            <Link href="/admin/companies/new">
              <Plus className="size-4" /> Nova empresa
            </Link>
          </Button>
        }
      />

      <form className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder="Buscar por nome ou CNPJ" className="pl-9" />
      </form>

      <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        {companies.map((c) => {
          const status = companyStatus(c.status);
          return (
            <Link key={c.id} href={`/admin/companies/${c.id}`}>
              <Card className="transition-colors hover:border-primary/25">
                <CardContent className="space-y-2 pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.nomeFantasia}</p>
                      <p className="truncate text-[12.5px] text-muted-foreground">{c.cnpj}</p>
                    </div>
                    <StatusBadge {...status} />
                  </div>
                  <div className="flex items-center justify-between text-[12.5px] text-muted-foreground">
                    <span>{c.subscription?.plan.name ?? "Sem plano"} · {c._count.users} usuários</span>
                    <span>{formatDate(c.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((c) => {
              const status = companyStatus(c.status);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/companies/${c.id}`} className="font-medium hover:underline">
                      {c.nomeFantasia}
                    </Link>
                    <p className="text-[12.5px] text-muted-foreground">{c.cnpj}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.subscription?.plan.name ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{c._count.users}</TableCell>
                  <TableCell>
                    <StatusBadge {...status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

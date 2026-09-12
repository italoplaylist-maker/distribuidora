import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { getCompanyAdminDetail } from "@/features/admin/queries";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { companyStatus, userStatus } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { CompanyStatusActions } from "@/features/admin/company-status-actions";
import { CompanyTrialForm } from "@/features/admin/company-trial-form";
import { ImpersonateButton } from "@/features/admin/impersonate-button";

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let company;
  try {
    company = await getCompanyAdminDetail(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const status = companyStatus(company.status);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">{company.nomeFantasia}</h1>
          <p className="text-[13.5px] text-muted-foreground">
            {company.razaoSocial} · {company.cnpj}
          </p>
        </div>
        <StatusBadge {...status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <ImpersonateButton companyId={company.id} />
        <Button variant="outline" asChild>
          <Link href={`/admin/companies/${company.id}/edit`}>
            <Pencil className="size-4" /> Editar
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-[14px] font-semibold">Ações</p>
          <CompanyStatusActions companyId={company.id} status={company.status} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-[14px] font-semibold">Período de teste</p>
          <CompanyTrialForm companyId={company.id} trialEndsAt={company.trialEndsAt.toISOString()} trialBehavior={company.trialBehavior} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard label="Usuários" value={company.users.length} />
        <StatCard label="Produtos" value={company._count.products} />
        <StatCard label="Clientes" value={company._count.customers} />
        <StatCard label="Vendas" value={company._count.sales} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-1 text-[14px] font-semibold">Usuários da empresa</p>
          <div className="divide-y divide-border/60">
            {company.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {u.email} · {u.role ?? "-"}
                  </p>
                </div>
                <StatusBadge {...userStatus(u.active)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-[12.5px] text-muted-foreground">Cadastrada em {formatDate(company.createdAt)}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-[12.5px] text-muted-foreground">{label}</p>
        <p className="text-[19px] font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

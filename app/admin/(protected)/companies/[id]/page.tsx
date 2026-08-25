import { notFound } from "next/navigation";
import { getCompanyAdminDetail } from "@/features/admin/queries";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { prisma } from "@/lib/database/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CompanyStatusActions } from "@/features/admin/company-status-actions";
import { CompanyPlanForm, CompanyTrialForm } from "@/features/admin/company-plan-trial-form";

const STATUS_INFO: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  TRIAL: { label: "Trial", variant: "warning" },
  ACTIVE: { label: "Ativa", variant: "success" },
  PAST_DUE: { label: "Inadimplente", variant: "warning" },
  SUSPENDED: { label: "Suspensa", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
};

export default async function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let company;
  try {
    company = await getCompanyAdminDetail(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const plans = await prisma.plan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{company.nomeFantasia}</h1>
          <p className="text-sm text-zinc-500">{company.razaoSocial} · {company.cnpj}</p>
        </div>
        <Badge variant={STATUS_INFO[company.status].variant}>{STATUS_INFO[company.status].label}</Badge>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-5">
        <p className="mb-3 text-sm font-medium text-zinc-300">Ações</p>
        <CompanyStatusActions companyId={company.id} status={company.status} />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-5 space-y-3">
        <p className="text-sm font-medium text-zinc-300">Plano</p>
        <CompanyPlanForm companyId={company.id} planId={company.subscription?.planId} plans={plans.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-5 space-y-3">
        <p className="text-sm font-medium text-zinc-300">Período de teste</p>
        <CompanyTrialForm companyId={company.id} trialEndsAt={company.trialEndsAt.toISOString()} trialBehavior={company.trialBehavior} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Usuários" value={company._count.products !== undefined ? company.users.length : 0} />
        <StatCard label="Produtos" value={company._count.products} />
        <StatCard label="Clientes" value={company._count.customers} />
        <StatCard label="Vendas" value={company._count.sales} />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-5">
        <p className="mb-3 text-sm font-medium text-zinc-300">Usuários da empresa</p>
        <div className="divide-y divide-zinc-800">
          {company.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-zinc-100">{u.name}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <Badge variant={u.active ? "success" : "secondary"}>{u.role ?? "-"}</Badge>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-zinc-600">Cadastrada em {formatDate(company.createdAt)}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-100">{value}</p>
    </div>
  );
}

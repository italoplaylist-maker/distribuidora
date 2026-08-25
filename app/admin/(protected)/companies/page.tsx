import Link from "next/link";
import { listCompaniesAdmin } from "@/features/admin/queries";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const STATUS_INFO: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  TRIAL: { label: "Trial", variant: "warning" },
  ACTIVE: { label: "Ativa", variant: "success" },
  PAST_DUE: { label: "Inadimplente", variant: "warning" },
  SUSPENDED: { label: "Suspensa", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
};

export default async function AdminCompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const companies = await listCompaniesAdmin(q);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Empresas</h1>
        <p className="text-sm text-zinc-500">{companies.length} empresas cadastradas na plataforma</p>
      </div>

      <form className="max-w-sm">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou CNPJ"
          className="h-11 w-full rounded-xl border border-zinc-800 bg-[#111315] px-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-xs uppercase text-zinc-500">
            <tr>
              <th className="p-3 text-left">Empresa</th>
              <th className="p-3 text-left">Plano</th>
              <th className="p-3 text-left">Usuários</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">
                <td className="p-3">
                  <Link href={`/admin/companies/${c.id}`} className="font-medium text-zinc-100 hover:text-primary">
                    {c.nomeFantasia}
                  </Link>
                  <p className="text-xs text-zinc-500">{c.cnpj}</p>
                </td>
                <td className="p-3 text-zinc-400">{c.subscription?.plan.name ?? "-"}</td>
                <td className="p-3 text-zinc-400">{c._count.users}</td>
                <td className="p-3">
                  <Badge variant={STATUS_INFO[c.status].variant}>{STATUS_INFO[c.status].label}</Badge>
                </td>
                <td className="p-3 text-zinc-400">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listCompanyAuditLogs } from "@/features/audit/queries";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ScrollText } from "lucide-react";
import { formatDate } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  "product.create": "Cadastrou produto",
  "product.update": "Atualizou produto",
  "product.delete": "Removeu produto",
  "stock.adjust": "Ajustou estoque",
  "customer.create": "Cadastrou cliente",
  "customer.update": "Atualizou cliente",
  "customer.delete": "Removeu cliente",
  "supplier.create": "Cadastrou fornecedor",
  "supplier.update": "Atualizou fornecedor",
  "supplier.delete": "Removeu fornecedor",
  "sale.create": "Realizou venda",
  "sale.cancel": "Cancelou venda",
  "purchase.create": "Registrou compra",
  "purchase.cancel": "Cancelou compra",
  "receivable.pay": "Recebeu pagamento",
  "payable.pay": "Pagou fornecedor",
  "cash.open": "Abriu caixa",
  "cash.close": "Fechou caixa",
  "cash.sangria": "Sangria de caixa",
  "cash.suprimento": "Suprimento de caixa",
  "delivery.status_update": "Atualizou entrega",
  "delivery.assign_driver": "Atribuiu motorista",
  "user.create": "Criou usuário",
  "user.activate": "Ativou usuário",
  "user.deactivate": "Desativou usuário",
  "company.update": "Atualizou dados da empresa",
  "company.settings_update": "Atualizou preferências",
  "company.signup": "Empresa cadastrada",
  "subscription.activate": "Ativou assinatura",
};

export default async function AuditPage() {
  const tenant = await getCurrentTenant();
  const logs = await listCompanyAuditLogs(tenant.companyId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Auditoria</h1>
      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="Nenhum registro de auditoria" description="As ações realizadas no sistema aparecerão aqui." />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border pt-5">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.user?.name ?? "Sistema"} · {log.entity}
                    {log.entityId ? ` #${log.entityId.slice(-6)}` : ""}
                  </p>
                </div>
                <p className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

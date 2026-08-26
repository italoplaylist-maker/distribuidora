import { getPlatformAuditLogs } from "@/features/admin/queries";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/utils";

export default async function AdminAuditPage() {
  const logs = await getPlatformAuditLogs();

  return (
    <div className="space-y-5">
      <PageHeader title="Auditoria da plataforma" description={`${logs.length} registros`} />
      <Card>
        <CardContent className="divide-y divide-border/60 pt-6">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-4 py-3 text-[13.5px]">
              <div>
                <p className="font-medium">{log.action}</p>
                <p className="text-[12.5px] text-muted-foreground">
                  {log.company?.nomeFantasia ?? "Plataforma"} · {log.user?.name ?? "Sistema"} · {log.entity}
                  {log.entityId ? ` #${log.entityId.slice(-6)}` : ""}
                </p>
              </div>
              <p className="whitespace-nowrap text-[12.5px] text-muted-foreground">{formatDate(log.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

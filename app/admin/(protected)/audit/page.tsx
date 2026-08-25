import { getPlatformAuditLogs } from "@/features/admin/queries";
import { formatDate } from "@/lib/utils";

export default async function AdminAuditPage() {
  const logs = await getPlatformAuditLogs();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Auditoria da plataforma</h1>
      <div className="rounded-2xl border border-zinc-800 bg-[#111315] divide-y divide-zinc-800">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start justify-between gap-4 p-4 text-sm">
            <div>
              <p className="font-medium text-zinc-100">{log.action}</p>
              <p className="text-xs text-zinc-500">
                {log.company?.nomeFantasia ?? "Plataforma"} · {log.user?.name ?? "Sistema"} · {log.entity}
                {log.entityId ? ` #${log.entityId.slice(-6)}` : ""}
              </p>
            </div>
            <p className="whitespace-nowrap text-xs text-zinc-500">{formatDate(log.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

import "server-only";
import { prisma } from "@/lib/database/prisma";

export async function listCompanyAuditLogs(companyId: string) {
  return prisma.auditLog.findMany({
    where: { companyId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

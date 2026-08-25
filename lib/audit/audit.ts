import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/database/prisma";
import type { Prisma } from "@prisma/client";

interface AuditParams {
  companyId: string | null;
  userId: string | null;
  action: string;
  entity: string;
  entityId?: string;
  previousData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
}

/** Records an audit trail entry. Never throws — a logging failure must not break the business flow. */
export async function recordAudit(params: AuditParams) {
  try {
    const h = await headers();
    await prisma.auditLog.create({
      data: {
        companyId: params.companyId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        previousData: params.previousData ?? undefined,
        newData: params.newData ?? undefined,
        ip: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
        userAgent: h.get("user-agent") ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record audit log", err);
  }
}

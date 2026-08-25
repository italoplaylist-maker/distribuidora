"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/guard";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { companySchema } from "@/schemas/user";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function updateCompanyProfileAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.COMPANY_SETTINGS);
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  await prisma.company.update({ where: { id: tenant.companyId }, data: parsed.data });

  await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: "company.update", entity: "Company", entityId: tenant.companyId });

  revalidatePath("/dashboard/settings/company");
  return { success: true };
}

export async function updateCompanySettingsAction(input: {
  allowNegativeStock: boolean;
  requireUniqueBarcode: boolean;
  lowStockAlert: boolean;
  defaultPaymentTermDays: number;
}): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.COMPANY_SETTINGS);

  await prisma.companySettings.upsert({
    where: { companyId: tenant.companyId },
    update: input,
    create: { companyId: tenant.companyId, ...input },
  });

  await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: "company.settings_update", entity: "CompanySettings", entityId: tenant.companyId, newData: input });

  revalidatePath("/dashboard/settings");
  return { success: true };
}

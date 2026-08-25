"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/tenant/tenant-context";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { planSchema, deleteCompanySchema } from "@/schemas/admin";
import type { CompanyStatus, TrialBehavior } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function updateCompanyStatusAction(companyId: string, status: CompanyStatus): Promise<ActionResult> {
  const admin = await requireSuperAdmin();

  const data: { status: CompanyStatus; suspendedAt?: Date; canceledAt?: Date } = { status };
  if (status === "SUSPENDED") data.suspendedAt = new Date();
  if (status === "CANCELED") data.canceledAt = new Date();

  await prisma.company.update({ where: { id: companyId }, data });

  await recordAudit({ companyId, userId: admin.id, action: `admin.company_status_${status.toLowerCase()}`, entity: "Company", entityId: companyId, newData: { status } });

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}

export async function updateCompanyTrialAction(companyId: string, trialEndsAt: string, trialBehavior: TrialBehavior): Promise<ActionResult> {
  const admin = await requireSuperAdmin();

  await prisma.company.update({ where: { id: companyId }, data: { trialEndsAt: new Date(trialEndsAt), trialBehavior } });

  await recordAudit({ companyId, userId: admin.id, action: "admin.company_trial_update", entity: "Company", entityId: companyId, newData: { trialEndsAt, trialBehavior } });

  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}

export async function updateCompanyPlanAction(companyId: string, planId: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();

  await prisma.subscription.update({ where: { companyId }, data: { planId } });

  await recordAudit({ companyId, userId: admin.id, action: "admin.company_plan_update", entity: "Subscription", entityId: companyId, newData: { planId } });

  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}

export async function createPlanAction(input: unknown): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  const plan = await prisma.plan.create({ data: parsed.data });

  await recordAudit({ companyId: null, userId: admin.id, action: "admin.plan_create", entity: "Plan", entityId: plan.id, newData: { name: plan.name } });

  revalidatePath("/admin/plans");
  return { success: true, id: plan.id };
}

export async function updatePlanAction(planId: string, input: unknown): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  await prisma.plan.update({ where: { id: planId }, data: parsed.data });

  await recordAudit({ companyId: null, userId: admin.id, action: "admin.plan_update", entity: "Plan", entityId: planId });

  revalidatePath("/admin/plans");
  return { success: true };
}

export async function togglePlanActiveAction(planId: string, active: boolean): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  await prisma.plan.update({ where: { id: planId }, data: { active } });
  await recordAudit({ companyId: null, userId: admin.id, action: active ? "admin.plan_activate" : "admin.plan_deactivate", entity: "Plan", entityId: planId });
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function deleteCompanyAction(input: unknown): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = deleteCompanySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const adminUser = await prisma.user.findUnique({ where: { id: admin.id } });
  if (!adminUser) return { success: false, error: "Sessão inválida" };

  const validPassword = await bcrypt.compare(data.password, adminUser.passwordHash);
  if (!validPassword) return { success: false, error: "Senha incorreta" };

  const company = await prisma.company.findUnique({ where: { id: data.companyId } });
  if (!company) return { success: false, error: "Empresa não encontrada" };

  await prisma.company.update({
    where: { id: data.companyId },
    data: { deletedAt: new Date(), status: "CANCELED", cancelReason: data.reason },
  });

  await recordAudit({
    companyId: data.companyId,
    userId: admin.id,
    action: "admin.company_delete",
    entity: "Company",
    entityId: data.companyId,
    newData: { reason: data.reason },
  });

  revalidatePath("/admin/companies");
  return { success: true };
}

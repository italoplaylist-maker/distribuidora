"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/tenant/tenant-context";
import { startImpersonation, clearImpersonation, getImpersonation } from "@/lib/auth/impersonation";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { planSchema, deleteCompanySchema, createCompanySchema, updateCompanySchema, changeAdminPasswordSchema } from "@/schemas/admin";
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

export async function createCompanyAction(input: unknown): Promise<ActionResult & { temporaryPassword?: string }> {
  const admin = await requireSuperAdmin();
  const parsed = createCompanySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const [existingCnpj, existingEmail, plan] = await Promise.all([
    prisma.company.findUnique({ where: { cnpj: data.cnpj } }),
    prisma.user.findUnique({ where: { email: data.adminEmail.toLowerCase().trim() } }),
    prisma.plan.findUnique({ where: { id: data.planId } }),
  ]);

  if (existingCnpj) return { success: false, error: "Já existe uma empresa cadastrada com este CNPJ" };
  if (existingEmail) return { success: false, error: "Já existe uma conta com este e-mail" };
  if (!plan) return { success: false, error: "Plano inválido" };

  const now = new Date();
  const temporaryPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const isActive = data.status === "ACTIVE";
  const trialEndsAt = new Date(now.getTime() + data.trialDays * 24 * 60 * 60 * 1000);
  const periodEnd = isActive ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : trialEndsAt;

  const company = await prisma.company.create({
    data: {
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      cnpj: data.cnpj,
      email: data.companyEmail,
      phone: data.phone,
      status: data.status,
      trialStartsAt: now,
      trialEndsAt,
      settings: { create: {} },
      subscription: {
        create: {
          planId: plan.id,
          status: isActive ? "ACTIVE" : "TRIALING",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          paymentProvider: "manual",
        },
      },
      users: {
        create: {
          userType: "COMPANY_USER",
          name: data.adminName,
          email: data.adminEmail.toLowerCase().trim(),
          passwordHash,
          role: "ADMINISTRADOR",
        },
      },
    },
    include: { users: true },
  });

  await recordAudit({
    companyId: company.id,
    userId: admin.id,
    action: "admin.company_create",
    entity: "Company",
    entityId: company.id,
    newData: { nomeFantasia: company.nomeFantasia, plan: plan.name, status: data.status },
  });

  revalidatePath("/admin/companies");
  return { success: true, id: company.id, temporaryPassword };
}

export async function updateCompanyAction(companyId: string, input: unknown): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = updateCompanySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const existing = await prisma.company.findUnique({ where: { id: companyId } });
  if (!existing) return { success: false, error: "Empresa não encontrada" };

  if (data.cnpj !== existing.cnpj) {
    const dup = await prisma.company.findFirst({ where: { cnpj: data.cnpj, id: { not: companyId } } });
    if (dup) return { success: false, error: "Já existe uma empresa cadastrada com este CNPJ" };
  }

  await prisma.company.update({
    where: { id: companyId },
    data: {
      razaoSocial: data.razaoSocial,
      nomeFantasia: data.nomeFantasia,
      cnpj: data.cnpj,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      address: data.address,
      city: data.city,
      state: data.state,
    },
  });

  await recordAudit({
    companyId,
    userId: admin.id,
    action: "admin.company_update",
    entity: "Company",
    entityId: companyId,
    previousData: { nomeFantasia: existing.nomeFantasia, cnpj: existing.cnpj },
    newData: { nomeFantasia: data.nomeFantasia, cnpj: data.cnpj },
  });

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${companyId}`);
  return { success: true };
}

export async function changeAdminPasswordAction(input: unknown): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const parsed = changeAdminPasswordSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const adminUser = await prisma.user.findUnique({ where: { id: admin.id } });
  if (!adminUser) return { success: false, error: "Sessão inválida" };

  const validPassword = await bcrypt.compare(data.currentPassword, adminUser.passwordHash);
  if (!validPassword) return { success: false, error: "Senha atual incorreta" };

  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash: await bcrypt.hash(data.newPassword, 10) },
  });

  await recordAudit({ companyId: null, userId: admin.id, action: "admin.password_update", entity: "User", entityId: admin.id });

  return { success: true };
}

export async function impersonateCompanyAction(companyId: string): Promise<ActionResult> {
  const admin = await requireSuperAdmin();

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company || company.deletedAt) return { success: false, error: "Empresa não encontrada" };

  const target =
    (await prisma.user.findFirst({ where: { companyId, userType: "COMPANY_USER", active: true, role: "ADMINISTRADOR" }, orderBy: { createdAt: "asc" } })) ??
    (await prisma.user.findFirst({ where: { companyId, userType: "COMPANY_USER", active: true }, orderBy: { createdAt: "asc" } }));

  if (!target) return { success: false, error: "Esta empresa não possui usuários ativos" };

  await startImpersonation({ adminId: admin.id, adminName: admin.name ?? "Super Admin", companyId, userId: target.id });

  await recordAudit({
    companyId,
    userId: admin.id,
    action: "admin.impersonate_start",
    entity: "Company",
    entityId: companyId,
    newData: { targetUserId: target.id, targetUserName: target.name },
  });

  redirect("/dashboard");
}

export async function stopImpersonationAction(): Promise<ActionResult> {
  const admin = await requireSuperAdmin();
  const impersonation = await getImpersonation();
  await clearImpersonation();

  if (impersonation) {
    await recordAudit({
      companyId: impersonation.companyId,
      userId: admin.id,
      action: "admin.impersonate_stop",
      entity: "Company",
      entityId: impersonation.companyId,
    });
  }

  redirect(impersonation ? `/admin/companies/${impersonation.companyId}` : "/admin/companies");
}

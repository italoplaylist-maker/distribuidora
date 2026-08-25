"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/guard";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { assertWithinPlanLimit } from "@/lib/tenant/limits";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { createUserSchema } from "@/schemas/user";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createCompanyUserAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.USERS_MANAGE);
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  await assertWithinPlanLimit(tenant.companyId, "users");

  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (existing) return { success: false, error: "Já existe uma conta com este e-mail" };

  const user = await prisma.user.create({
    data: {
      userType: "COMPANY_USER",
      companyId: tenant.companyId,
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(data.password, 10),
      role: data.role,
    },
  });

  if (data.role === "MOTORISTA") {
    await prisma.driver.create({ data: { companyId: tenant.companyId, userId: user.id, name: user.name } });
  }

  await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: "user.create", entity: "User", entityId: user.id, newData: { role: data.role } });

  revalidatePath("/dashboard/settings/users");
  return { success: true };
}

export async function toggleUserActiveAction(userId: string, active: boolean): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.USERS_MANAGE);
  const user = await prisma.user.findFirst({ where: { id: userId, companyId: tenant.companyId } });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  if (user.id === tenant.userId) return { success: false, error: "Você não pode desativar sua própria conta" };

  await prisma.user.update({ where: { id: userId }, data: { active } });

  await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: active ? "user.activate" : "user.deactivate", entity: "User", entityId: userId });

  revalidatePath("/dashboard/settings/users");
  return { success: true };
}

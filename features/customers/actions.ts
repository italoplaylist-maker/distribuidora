"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/guard";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { assertWithinPlanLimit } from "@/lib/tenant/limits";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { customerSchema } from "@/schemas/customer";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function createCustomerAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  await assertWithinPlanLimit(tenant.companyId, "customers");

  const customer = await prisma.customer.create({
    data: { companyId: tenant.companyId, ...parsed.data },
  });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "customer.create",
    entity: "Customer",
    entityId: customer.id,
    newData: { name: customer.name },
  });

  revalidatePath("/dashboard/customers");
  return { success: true, id: customer.id };
}

export async function updateCustomerAction(customerId: string, input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  const existing = await prisma.customer.findFirst({ where: { id: customerId, companyId: tenant.companyId } });
  if (!existing) throw new NotFoundError("Cliente não encontrado");

  await prisma.customer.update({ where: { id: customerId }, data: parsed.data });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "customer.update",
    entity: "Customer",
    entityId: customerId,
    previousData: { name: existing.name },
    newData: { name: parsed.data.name },
  });

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true, id: customerId };
}

export async function deleteCustomerAction(customerId: string): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.CUSTOMERS_MANAGE);
  const existing = await prisma.customer.findFirst({ where: { id: customerId, companyId: tenant.companyId } });
  if (!existing) throw new NotFoundError("Cliente não encontrado");

  await prisma.customer.update({ where: { id: customerId }, data: { active: false } });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "customer.delete",
    entity: "Customer",
    entityId: customerId,
  });

  revalidatePath("/dashboard/customers");
  return { success: true };
}

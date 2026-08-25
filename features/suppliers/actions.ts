"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/guard";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { assertWithinPlanLimit } from "@/lib/tenant/limits";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { supplierSchema } from "@/schemas/supplier";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function createSupplierAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.SUPPLIERS_MANAGE);
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  await assertWithinPlanLimit(tenant.companyId, "suppliers");

  const supplier = await prisma.supplier.create({
    data: { companyId: tenant.companyId, ...parsed.data, email: parsed.data.email || undefined },
  });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "supplier.create",
    entity: "Supplier",
    entityId: supplier.id,
    newData: { name: supplier.name },
  });

  revalidatePath("/dashboard/suppliers");
  return { success: true, id: supplier.id };
}

export async function updateSupplierAction(supplierId: string, input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.SUPPLIERS_MANAGE);
  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  const existing = await prisma.supplier.findFirst({ where: { id: supplierId, companyId: tenant.companyId } });
  if (!existing) throw new NotFoundError("Fornecedor não encontrado");

  await prisma.supplier.update({ where: { id: supplierId }, data: { ...parsed.data, email: parsed.data.email || undefined } });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "supplier.update",
    entity: "Supplier",
    entityId: supplierId,
  });

  revalidatePath("/dashboard/suppliers");
  revalidatePath(`/dashboard/suppliers/${supplierId}`);
  return { success: true, id: supplierId };
}

export async function deleteSupplierAction(supplierId: string): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.SUPPLIERS_MANAGE);
  const existing = await prisma.supplier.findFirst({ where: { id: supplierId, companyId: tenant.companyId } });
  if (!existing) throw new NotFoundError("Fornecedor não encontrado");

  await prisma.supplier.update({ where: { id: supplierId }, data: { active: false } });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "supplier.delete",
    entity: "Supplier",
    entityId: supplierId,
  });

  revalidatePath("/dashboard/suppliers");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/guard";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { NotFoundError, ForbiddenError } from "@/lib/tenant/tenant-context";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { DeliveryStatus } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function assertOwnDeliveryIfDriver(companyId: string, role: string | null, userId: string, deliveryId: string) {
  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, companyId }, include: { driver: true } });
  if (!delivery) throw new NotFoundError("Entrega não encontrada");
  if (role === "MOTORISTA" && delivery.driver?.userId !== userId) {
    throw new ForbiddenError("Esta entrega não está atribuída a você");
  }
  return delivery;
}

export async function updateDeliveryStatusAction(deliveryId: string, status: DeliveryStatus): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.DELIVERIES_MANAGE);

  try {
    await assertOwnDeliveryIfDriver(tenant.companyId, tenant.role, tenant.userId, deliveryId);

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: { status, deliveredAt: status === "DELIVERED" ? new Date() : undefined },
    });

    await recordAudit({
      companyId: tenant.companyId,
      userId: tenant.userId,
      action: "delivery.status_update",
      entity: "Delivery",
      entityId: deliveryId,
      newData: { status },
    });

    revalidatePath("/dashboard/deliveries");
    revalidatePath(`/dashboard/deliveries/${deliveryId}`);
    return { success: true };
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) return { success: false, error: err.message };
    throw err;
  }
}

export async function assignDriverAction(deliveryId: string, driverId: string): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.DELIVERIES_MANAGE);

  const delivery = await prisma.delivery.findFirst({ where: { id: deliveryId, companyId: tenant.companyId } });
  if (!delivery) return { success: false, error: "Entrega não encontrada" };

  const driver = await prisma.driver.findFirst({ where: { id: driverId, companyId: tenant.companyId } });
  if (!driver) return { success: false, error: "Motorista não encontrado" };

  await prisma.delivery.update({ where: { id: deliveryId }, data: { driverId } });

  await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: "delivery.assign_driver", entity: "Delivery", entityId: deliveryId, newData: { driverId } });

  revalidatePath("/dashboard/deliveries");
  revalidatePath(`/dashboard/deliveries/${deliveryId}`);
  return { success: true };
}

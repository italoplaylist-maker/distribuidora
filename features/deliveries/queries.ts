import "server-only";
import { prisma } from "@/lib/database/prisma";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import type { CompanyRole } from "@prisma/client";

export async function listDeliveries(companyId: string, role: CompanyRole | null, userId: string) {
  const driverFilter = role === "MOTORISTA" ? { driver: { userId } } : {};
  return prisma.delivery.findMany({
    where: { companyId, ...driverFilter },
    include: { customer: true, driver: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDeliveryOrThrow(companyId: string, deliveryId: string) {
  const delivery = await prisma.delivery.findFirst({
    where: { id: deliveryId, companyId },
    include: { customer: true, driver: true, sale: true, items: { include: { product: true } } },
  });
  if (!delivery) throw new NotFoundError("Entrega não encontrada");
  return delivery;
}

export async function listActiveDrivers(companyId: string) {
  return prisma.driver.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" } });
}

import "server-only";
import { prisma } from "@/lib/database/prisma";
import { NotFoundError } from "@/lib/tenant/tenant-context";

export async function listPurchases(companyId: string) {
  return prisma.purchase.findMany({
    where: { companyId },
    include: { supplier: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getPurchaseOrThrow(companyId: string, purchaseId: string) {
  const purchase = await prisma.purchase.findFirst({
    where: { id: purchaseId, companyId },
    include: { items: { include: { product: true } }, supplier: true, user: true },
  });
  if (!purchase) throw new NotFoundError("Compra não encontrada");
  return purchase;
}

export async function listActiveSuppliers(companyId: string) {
  return prisma.supplier.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" } });
}

import "server-only";
import { prisma } from "@/lib/database/prisma";
import { NotFoundError } from "@/lib/tenant/tenant-context";

export async function listSuppliers(companyId: string, search?: string) {
  return prisma.supplier.findMany({
    where: {
      companyId,
      active: true,
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { document: { contains: search } }] } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getSupplierOrThrow(companyId: string, supplierId: string) {
  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, companyId } });
  if (!supplier) throw new NotFoundError("Fornecedor não encontrado");
  return supplier;
}

export async function getSupplierPurchaseHistory(companyId: string, supplierId: string) {
  await getSupplierOrThrow(companyId, supplierId);
  return prisma.purchase.findMany({
    where: { companyId, supplierId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

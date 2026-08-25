import "server-only";
import { prisma } from "@/lib/database/prisma";
import { NotFoundError } from "@/lib/tenant/tenant-context";

export async function searchSaleProducts(companyId: string, query: string) {
  if (!query || query.trim().length < 1) {
    return prisma.product.findMany({ where: { companyId, active: true }, orderBy: { name: "asc" }, take: 12 });
  }
  return prisma.product.findMany({
    where: {
      companyId,
      active: true,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { barcode: { contains: query } },
      ],
    },
    take: 12,
    orderBy: { name: "asc" },
  });
}

export async function listSales(companyId: string) {
  return prisma.sale.findMany({
    where: { companyId },
    include: { customer: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getSaleOrThrow(companyId: string, saleId: string) {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, companyId },
    include: { items: { include: { product: true } }, customer: true, user: true },
  });
  if (!sale) throw new NotFoundError("Venda não encontrada");
  return sale;
}

export async function getOpenCashRegister(companyId: string) {
  return prisma.cashRegister.findFirst({ where: { companyId, status: "OPEN" }, orderBy: { openedAt: "desc" } });
}

export async function getRecentCustomers(companyId: string) {
  return prisma.customer.findMany({ where: { companyId, active: true }, orderBy: { createdAt: "desc" }, take: 20 });
}

import "server-only";
import { prisma } from "@/lib/database/prisma";
import { NotFoundError } from "@/lib/tenant/tenant-context";

export async function listCustomers(companyId: string, search?: string) {
  return prisma.customer.findMany({
    where: {
      companyId,
      active: true,
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { document: { contains: search } }, { phone: { contains: search } }] }
        : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerOrThrow(companyId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
  if (!customer) throw new NotFoundError("Cliente não encontrado");
  return customer;
}

export async function getCustomerSalesHistory(companyId: string, customerId: string) {
  await getCustomerOrThrow(companyId, customerId);
  return prisma.sale.findMany({
    where: { companyId, customerId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function getCustomerOpenReceivables(companyId: string, customerId: string) {
  return prisma.accountReceivable.findMany({
    where: { companyId, customerId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
    orderBy: { dueDate: "asc" },
  });
}

import "server-only";
import { prisma } from "@/lib/database/prisma";

export async function listReceivables(companyId: string) {
  return prisma.accountReceivable.findMany({
    where: { companyId },
    include: { customer: true },
    orderBy: { dueDate: "asc" },
  });
}

export async function listPayables(companyId: string) {
  return prisma.accountPayable.findMany({
    where: { companyId },
    include: { purchase: { include: { supplier: true } } },
    orderBy: { dueDate: "asc" },
  });
}

export async function getOpenCashRegister(companyId: string) {
  return prisma.cashRegister.findFirst({
    where: { companyId, status: "OPEN" },
    include: { movements: { orderBy: { createdAt: "desc" } }, user: true },
    orderBy: { openedAt: "desc" },
  });
}

export async function getCashRegisterHistory(companyId: string) {
  return prisma.cashRegister.findMany({
    where: { companyId, status: "CLOSED" },
    include: { user: true },
    orderBy: { closedAt: "desc" },
    take: 20,
  });
}

export async function getFinanceSummary(companyId: string) {
  const [receivablesAgg, payablesAgg] = await Promise.all([
    prisma.accountReceivable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
  ]);

  return {
    receivablesOpen: Number(receivablesAgg._sum.amount ?? 0) - Number(receivablesAgg._sum.paidAmount ?? 0),
    payablesOpen: Number(payablesAgg._sum.amount ?? 0) - Number(payablesAgg._sum.paidAmount ?? 0),
  };
}

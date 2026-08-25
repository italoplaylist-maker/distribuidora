import "server-only";
import { prisma } from "@/lib/database/prisma";

export async function getDashboardData(companyId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [salesToday, receivablesOpen, payablesOpen, lowStockCount, openCashRegister, recentSales] = await Promise.all([
    prisma.sale.findMany({
      where: { companyId, status: "COMPLETED", createdAt: { gte: startOfDay } },
      include: { items: { include: { product: true } } },
    }),
    prisma.accountReceivable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT count(*)::bigint as count FROM products WHERE "companyId" = $1 AND active = true AND stock <= "minStock"`,
      companyId,
    ),
    prisma.cashRegister.findFirst({ where: { companyId, status: "OPEN" }, orderBy: { openedAt: "desc" } }),
    prisma.sale.findMany({
      where: { companyId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: true },
    }),
  ]);

  const faturamentoHoje = salesToday.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const custoHoje = salesToday.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + Number(i.product.averageCost) * Number(i.quantity), 0),
    0,
  );
  const lucroHoje = faturamentoHoje - custoHoje;

  const receberTotal = Number(receivablesOpen._sum.amount ?? 0) - Number(receivablesOpen._sum.paidAmount ?? 0);
  const pagarTotal = Number(payablesOpen._sum.amount ?? 0) - Number(payablesOpen._sum.paidAmount ?? 0);

  return {
    vendasHoje: salesToday.length,
    faturamentoHoje,
    lucroHoje,
    saldoCaixa: openCashRegister ? Number(openCashRegister.expectedBalance) : null,
    contasReceber: receberTotal,
    contasPagar: pagarTotal,
    estoqueBaixo: Number(lowStockCount[0]?.count ?? 0),
    recentSales,
  };
}

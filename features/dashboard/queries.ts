import "server-only";
import { prisma } from "@/lib/database/prisma";
import { brazilDateKey, brazilHour, startOfDayBrazil, addDaysBrazil } from "@/lib/timezone";
import type { TrendPoint } from "@/components/trend-chart";
import type { RankingItem } from "@/components/ranking-list";

function bucketByDay(sales: { createdAt: Date; totalAmount: unknown }[], days: number): TrendPoint[] {
  const buckets = new Map<string, number>();
  const today = startOfDayBrazil();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(brazilDateKey(addDaysBrazil(today, -i)), 0);
  }
  for (const sale of sales) {
    const key = brazilDateKey(sale.createdAt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(sale.totalAmount));
  }
  return [...buckets.entries()].map(([key, value]) => {
    const [, month, day] = key.split("-");
    return { label: `${day}/${month}`, value };
  });
}

function bucketByHour(sales: { createdAt: Date; totalAmount: unknown }[]): TrendPoint[] {
  const buckets = new Map<number, number>();
  for (let h = 0; h < 24; h += 2) buckets.set(h, 0);
  for (const sale of sales) {
    const hour = brazilHour(sale.createdAt);
    const bucket = hour - (hour % 2);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + Number(sale.totalAmount));
  }
  return [...buckets.entries()].map(([hour, value]) => ({ label: `${hour}h`, value }));
}

export async function getDashboardData(companyId: string) {
  const today = startOfDayBrazil();
  const yesterday = addDaysBrazil(today, -1);
  const monthAgo = addDaysBrazil(today, -30);

  const [
    salesToday,
    salesYesterdayAgg,
    salesLast30Days,
    receivablesOpen,
    payablesOpen,
    overdueReceivablesAgg,
    overduePayablesAgg,
    stockAgg,
    lowStockProducts,
    openCashRegister,
    recentSales,
    recentPurchases,
    recentReceipts,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: { companyId, status: "COMPLETED", createdAt: { gte: today } },
      include: { items: { include: { product: true } } },
    }),
    prisma.sale.aggregate({
      where: { companyId, status: "COMPLETED", createdAt: { gte: yesterday, lt: today } },
      _sum: { totalAmount: true },
    }),
    prisma.sale.findMany({
      where: { companyId, status: "COMPLETED", createdAt: { gte: monthAgo } },
      select: {
        createdAt: true,
        totalAmount: true,
        items: { select: { productId: true, quantity: true, totalPrice: true, product: { select: { name: true, averageCost: true } } } },
      },
    }),
    prisma.accountReceivable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
      _count: true,
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountReceivable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] }, dueDate: { lt: today } },
      _sum: { amount: true, paidAmount: true },
      _count: true,
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] }, dueDate: { lt: today } },
      _sum: { amount: true, paidAmount: true },
      _count: true,
    }),
    prisma.$queryRawUnsafe<{ count: bigint; value: number; potential: number }[]>(
      `SELECT count(*)::bigint as count, coalesce(sum(stock * "averageCost"), 0)::float as value, coalesce(sum(stock * price), 0)::float as potential FROM products WHERE "companyId" = $1 AND active = true`,
      companyId,
    ),
    prisma.$queryRawUnsafe<{ id: string; name: string; stock: string; unit: string; minStock: string }[]>(
      `SELECT id, name, stock::text, unit, "minStock"::text FROM products WHERE "companyId" = $1 AND active = true AND stock <= "minStock" ORDER BY stock ASC LIMIT 6`,
      companyId,
    ),
    prisma.cashRegister.findFirst({ where: { companyId, status: "OPEN" }, orderBy: { openedAt: "desc" } }),
    prisma.sale.findMany({
      where: { companyId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { customer: true },
    }),
    prisma.purchase.findMany({
      where: { companyId, status: "RECEIVED" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { supplier: true, items: true },
    }),
    prisma.financialTransaction.findMany({
      where: { companyId, type: "RECEIPT" },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const faturamentoHoje = salesToday.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const custoHoje = salesToday.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + Number(i.product.averageCost) * Number(i.quantity), 0),
    0,
  );
  const lucroHoje = faturamentoHoje - custoHoje;
  const faturamentoOntem = Number(salesYesterdayAgg._sum.totalAmount ?? 0);
  const variacaoVendas = faturamentoOntem > 0 ? ((faturamentoHoje - faturamentoOntem) / faturamentoOntem) * 100 : null;

  const receberTotal = Number(receivablesOpen._sum.amount ?? 0) - Number(receivablesOpen._sum.paidAmount ?? 0);
  const pagarTotal = Number(payablesOpen._sum.amount ?? 0) - Number(payablesOpen._sum.paidAmount ?? 0);
  const overdueReceivablesTotal = Number(overdueReceivablesAgg._sum.amount ?? 0) - Number(overdueReceivablesAgg._sum.paidAmount ?? 0);
  const overduePayablesTotal = Number(overduePayablesAgg._sum.amount ?? 0) - Number(overduePayablesAgg._sum.paidAmount ?? 0);

  const salesToday30 = salesLast30Days.filter((s) => s.createdAt >= today);
  const salesWeek = salesLast30Days.filter((s) => s.createdAt >= new Date(today.getTime() - 6 * 86400000));

  const faturamentoMes = salesLast30Days.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const custoMes = salesLast30Days.reduce(
    (sum, s) => sum + s.items.reduce((iSum, i) => iSum + Number(i.product.averageCost) * Number(i.quantity), 0),
    0,
  );
  const lucroMes = faturamentoMes - custoMes;
  const margemMedia = faturamentoMes > 0 ? (lucroMes / faturamentoMes) * 100 : null;
  const ticketMedio = salesLast30Days.length > 0 ? faturamentoMes / salesLast30Days.length : 0;

  const productRevenue = new Map<string, { name: string; total: number }>();
  for (const sale of salesLast30Days) {
    for (const item of sale.items) {
      const entry = productRevenue.get(item.productId) ?? { name: item.product.name, total: 0 };
      entry.total += Number(item.totalPrice);
      productRevenue.set(item.productId, entry);
    }
  }
  const topProducts: RankingItem[] = [...productRevenue.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((p) => ({ label: p.name, value: p.total }));

  return {
    vendasHoje: salesToday.length,
    faturamentoHoje,
    lucroHoje,
    variacaoVendas,
    faturamentoMes,
    lucroMes,
    margemMedia,
    ticketMedio,
    saldoCaixa: openCashRegister ? Number(openCashRegister.expectedBalance) : null,
    contasReceber: receberTotal,
    receivablesPendingCount: receivablesOpen._count,
    contasPagar: pagarTotal,
    overdueReceivablesCount: overdueReceivablesAgg._count,
    overdueReceivablesTotal,
    overduePayablesCount: overduePayablesAgg._count,
    overduePayablesTotal,
    estoqueValor: Number(stockAgg[0]?.value ?? 0),
    estoquePotencial: Number(stockAgg[0]?.potential ?? 0),
    lucroPotencialEstoque: Number(stockAgg[0]?.potential ?? 0) - Number(stockAgg[0]?.value ?? 0),
    estoqueProdutosCount: Number(stockAgg[0]?.count ?? 0),
    lowStockItems: lowStockProducts,
    salesTrend: {
      today: bucketByHour(salesToday30),
      week: bucketByDay(salesWeek, 7),
      month: bucketByDay(salesLast30Days, 30),
    },
    topProducts,
    recentSales,
    recentPurchases,
    recentReceipts,
  };
}

import "server-only";
import { prisma } from "@/lib/database/prisma";
import { brazilYear, startOfMonthBrazil, startOfYearBrazil, startOfDayBrazil, addMonthsBrazil, BRAZIL_TIMEZONE } from "@/lib/timezone";

export async function getSalesReport(companyId: string) {
  const [byPaymentMethod, topProducts, totalAgg] = await Promise.all([
    prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: { companyId, status: "COMPLETED" },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { companyId, status: "COMPLETED" } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: "desc" } },
      take: 10,
    }),
    prisma.sale.aggregate({ where: { companyId, status: "COMPLETED" }, _sum: { totalAmount: true }, _count: true }),
  ]);

  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const topCustomersRaw = await prisma.sale.groupBy({
    by: ["customerId"],
    where: { companyId, status: "COMPLETED", customerId: { not: null } },
    _sum: { totalAmount: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 10,
  });
  const customerIds = topCustomersRaw.map((c) => c.customerId).filter((id): id is string => !!id);
  const customers = await prisma.customer.findMany({ where: { id: { in: customerIds } } });
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));

  return {
    totalRevenue: Number(totalAgg._sum.totalAmount ?? 0),
    totalSales: totalAgg._count,
    byPaymentMethod: byPaymentMethod.map((p) => ({ method: p.paymentMethod, total: Number(p._sum.totalAmount ?? 0), count: p._count })),
    topProducts: topProducts.map((p) => ({
      name: productMap.get(p.productId) ?? "-",
      quantity: Number(p._sum.quantity ?? 0),
      total: Number(p._sum.totalPrice ?? 0),
    })),
    topCustomers: topCustomersRaw.map((c) => ({
      name: c.customerId ? (customerMap.get(c.customerId) ?? "-") : "-",
      total: Number(c._sum.totalAmount ?? 0),
    })),
  };
}

export async function getStockReport(companyId: string) {
  const [products, sold30Days] = await Promise.all([
    prisma.product.findMany({ where: { companyId, active: true } }),
    prisma.stockMovement.groupBy({
      by: ["productId"],
      where: { companyId, type: "VENDA", createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      _sum: { quantity: true },
    }),
  ]);

  const totalValue = products.reduce((sum, p) => sum + Number(p.stock) * Number(p.averageCost), 0);
  const totalPotential = products.reduce((sum, p) => sum + Number(p.stock) * Number(p.price), 0);
  const lowStock = products.filter((p) => Number(p.stock) <= Number(p.minStock) && Number(p.stock) > 0);
  const zeroStock = products.filter((p) => Number(p.stock) <= 0);

  const soldQtyByProduct = new Map(sold30Days.map((s) => [s.productId, Math.abs(Number(s._sum.quantity ?? 0))]));
  const soldIds = new Set(soldQtyByProduct.keys());

  const withMargin = products
    .filter((p) => Number(p.price) > 0)
    .map((p) => ({ name: p.name, margin: ((Number(p.price) - Number(p.averageCost)) / Number(p.price)) * 100 }));

  const topTurnover = [...soldQtyByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([productId, qty]) => ({ name: products.find((p) => p.id === productId)?.name ?? "-", quantity: qty }));

  const staleProducts = products
    .filter((p) => Number(p.stock) > 0 && !soldIds.has(p.id))
    .slice(0, 15)
    .map((p) => ({ name: p.name, stock: p.stock.toString(), unit: p.unit }));

  return {
    totalProducts: products.length,
    totalValue,
    totalPotential,
    potentialProfit: totalPotential - totalValue,
    lowStockCount: lowStock.length,
    zeroStockCount: zeroStock.length,
    lowStockProducts: lowStock.slice(0, 15).map((p) => ({ name: p.name, stock: p.stock.toString(), minStock: p.minStock.toString() })),
    zeroStockProducts: zeroStock.slice(0, 15).map((p) => ({ name: p.name })),
    topTurnover,
    staleProducts,
    staleCount: products.filter((p) => Number(p.stock) > 0 && !soldIds.has(p.id)).length,
    topMargin: [...withMargin].sort((a, b) => b.margin - a.margin).slice(0, 10),
    bottomMargin: [...withMargin].sort((a, b) => a.margin - b.margin).slice(0, 10),
    // Full list for CSV export — `products` is already fully loaded above, so this is free (no extra query).
    exportRows: products.map((p) => {
      const stock = Number(p.stock);
      const cost = Number(p.averageCost);
      const price = Number(p.price);
      return {
        nome: p.name,
        sku: p.sku ?? "",
        estoque: stock,
        unidade: p.unit,
        custoMedio: cost,
        preco: price,
        valorInvestido: stock * cost,
        valorPotencial: stock * price,
        margem: price > 0 ? ((price - cost) / price) * 100 : null,
      };
    }),
  };
}

export async function getFinanceReport(companyId: string) {
  const [receivablesAgg, payablesAgg, transactionsByType] = await Promise.all([
    prisma.accountReceivable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.financialTransaction.groupBy({
      by: ["type"],
      where: { companyId },
      _sum: { amount: true },
    }),
  ]);

  const overdueReceivables = await prisma.accountReceivable.count({
    where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] }, dueDate: { lt: startOfDayBrazil() } },
  });

  return {
    receivablesOpen: Number(receivablesAgg._sum.amount ?? 0) - Number(receivablesAgg._sum.paidAmount ?? 0),
    payablesOpen: Number(payablesAgg._sum.amount ?? 0) - Number(payablesAgg._sum.paidAmount ?? 0),
    overdueReceivablesCount: overdueReceivables,
    byType: transactionsByType.map((t) => ({ type: t.type, total: Number(t._sum.amount ?? 0) })),
  };
}

export interface ProfitabilityPeriod {
  faturamento: number;
  custo: number;
  lucroBruto: number;
  margem: number | null;
  vendas: number;
}

function emptyProfitabilityPeriod(): ProfitabilityPeriod {
  return { faturamento: 0, custo: 0, lucroBruto: 0, margem: null, vendas: 0 };
}

/**
 * `r.month` comes back from the SQL below already converted to Brazil's
 * calendar (see the `AT TIME ZONE` conversion in the queries) — Postgres
 * hands it back as a naive value that the driver tags as UTC, so we read
 * it with UTC getters here rather than converting it again.
 */
function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Faturamento/custo por mês, agregados no banco (não carrega vendas linha a
 * linha em JS) para escalar independente do volume histórico de vendas.
 * Custo usa o averageCost *atual* do produto — mesma simplificação já usada
 * no dashboard, já que o sistema não guarda custo histórico por lote.
 *
 * `createdAt` é armazenado como horário UTC "naive" (sem timezone) — por
 * isso o `date_trunc` abaixo converte explicitamente para o calendário de
 * Brasília antes de truncar por mês; sem isso, vendas feitas à noite no
 * Brasil (já de madrugada em UTC) cairiam no mês seguinte por engano.
 */
export async function getProfitabilityAnalysis(companyId: string) {
  const now = new Date();
  const currentMonthStart = startOfMonthBrazil(now);
  const previousYearStart = startOfYearBrazil(brazilYear(now) - 1);

  const [revenueRows, costRows] = await Promise.all([
    prisma.$queryRawUnsafe<{ month: Date; faturamento: number; count: bigint }[]>(
      `SELECT date_trunc('month', "createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date as month, sum("totalAmount")::float as faturamento, count(*)::bigint as count
       FROM sales WHERE "companyId" = $1 AND status = 'COMPLETED' AND "createdAt" >= $2
       GROUP BY 1 ORDER BY 1`,
      companyId,
      previousYearStart,
    ),
    prisma.$queryRawUnsafe<{ month: Date; custo: number }[]>(
      `SELECT date_trunc('month', s."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date as month, sum(si.quantity * p."averageCost")::float as custo
       FROM sale_items si
       JOIN sales s ON s.id = si."saleId"
       JOIN products p ON p.id = si."productId"
       WHERE s."companyId" = $1 AND s.status = 'COMPLETED' AND s."createdAt" >= $2
       GROUP BY 1 ORDER BY 1`,
      companyId,
      previousYearStart,
    ),
  ]);

  const monthMap = new Map<string, ProfitabilityPeriod>();
  for (const r of revenueRows) {
    const key = monthKey(new Date(r.month));
    const p = monthMap.get(key) ?? emptyProfitabilityPeriod();
    p.faturamento += Number(r.faturamento ?? 0);
    p.vendas += Number(r.count ?? 0);
    monthMap.set(key, p);
  }
  for (const r of costRows) {
    const key = monthKey(new Date(r.month));
    const p = monthMap.get(key) ?? emptyProfitabilityPeriod();
    p.custo += Number(r.custo ?? 0);
    monthMap.set(key, p);
  }
  for (const p of monthMap.values()) {
    p.lucroBruto = p.faturamento - p.custo;
    p.margem = p.faturamento > 0 ? (p.lucroBruto / p.faturamento) * 100 : null;
  }

  function sumRange(startKey: string, endKeyExclusive: string): ProfitabilityPeriod {
    const period = emptyProfitabilityPeriod();
    for (const [key, p] of monthMap.entries()) {
      if (key >= startKey && key < endKeyExclusive) {
        period.faturamento += p.faturamento;
        period.custo += p.custo;
        period.vendas += p.vendas;
      }
    }
    period.lucroBruto = period.faturamento - period.custo;
    period.margem = period.faturamento > 0 ? (period.lucroBruto / period.faturamento) * 100 : null;
    return period;
  }

  const previousMonthDate = addMonthsBrazil(currentMonthStart, -1);
  const currentMonth = monthMap.get(monthKey(currentMonthStart)) ?? emptyProfitabilityPeriod();
  const previousMonth = monthMap.get(monthKey(previousMonthDate)) ?? emptyProfitabilityPeriod();

  // Year-over-year compares the same number of elapsed months, not full calendar years.
  const monthsElapsed = currentMonthStart.getUTCMonth() + 1;
  const currentYearStart = startOfYearBrazil(brazilYear(now));
  const currentYear = sumRange(monthKey(currentYearStart), monthKey(addMonthsBrazil(currentYearStart, monthsElapsed)));
  const previousYearToDate = sumRange(monthKey(previousYearStart), monthKey(addMonthsBrazil(previousYearStart, monthsElapsed)));

  function variation(curr: number, prev: number): number | null {
    return prev > 0 ? ((curr - prev) / prev) * 100 : null;
  }

  const monthlyEvolution = Array.from({ length: 6 }, (_, i) => {
    const d = addMonthsBrazil(currentMonthStart, -(5 - i));
    const p = monthMap.get(monthKey(d)) ?? emptyProfitabilityPeriod();
    return { label: d.toLocaleDateString("pt-BR", { month: "short", timeZone: BRAZIL_TIMEZONE }), faturamento: p.faturamento, custo: p.custo, lucroBruto: p.lucroBruto };
  });

  return {
    currentMonth,
    previousMonth,
    monthVariation: {
      faturamento: variation(currentMonth.faturamento, previousMonth.faturamento),
      lucroBruto: variation(currentMonth.lucroBruto, previousMonth.lucroBruto),
    },
    currentYear,
    previousYearToDate,
    yearVariation: {
      faturamento: variation(currentYear.faturamento, previousYearToDate.faturamento),
      lucroBruto: variation(currentYear.lucroBruto, previousYearToDate.lucroBruto),
    },
    monthlyEvolution,
  };
}

export async function getPurchasesReport(companyId: string) {
  const bySupplierRaw = await prisma.purchase.groupBy({
    by: ["supplierId"],
    where: { companyId, status: "RECEIVED" },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
    take: 10,
  });
  const supplierIds = bySupplierRaw.map((s) => s.supplierId);
  const suppliers = await prisma.supplier.findMany({ where: { id: { in: supplierIds } } });
  const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

  const totalAgg = await prisma.purchase.aggregate({ where: { companyId, status: "RECEIVED" }, _sum: { totalAmount: true }, _count: true });

  return {
    totalSpent: Number(totalAgg._sum.totalAmount ?? 0),
    totalPurchases: totalAgg._count,
    bySupplier: bySupplierRaw.map((s) => ({
      name: supplierMap.get(s.supplierId) ?? "-",
      total: Number(s._sum.totalAmount ?? 0),
      count: s._count,
    })),
  };
}

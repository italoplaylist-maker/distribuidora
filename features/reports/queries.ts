import "server-only";
import { prisma } from "@/lib/database/prisma";

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
  const products = await prisma.product.findMany({ where: { companyId, active: true } });

  const totalValue = products.reduce((sum, p) => sum + Number(p.stock) * Number(p.averageCost), 0);
  const lowStock = products.filter((p) => Number(p.stock) <= Number(p.minStock) && Number(p.stock) > 0);
  const zeroStock = products.filter((p) => Number(p.stock) <= 0);

  return {
    totalProducts: products.length,
    totalValue,
    lowStockCount: lowStock.length,
    zeroStockCount: zeroStock.length,
    lowStockProducts: lowStock.slice(0, 15).map((p) => ({ name: p.name, stock: p.stock.toString(), minStock: p.minStock.toString() })),
    zeroStockProducts: zeroStock.slice(0, 15).map((p) => ({ name: p.name })),
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
    where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] }, dueDate: { lt: new Date() } },
  });

  return {
    receivablesOpen: Number(receivablesAgg._sum.amount ?? 0) - Number(receivablesAgg._sum.paidAmount ?? 0),
    payablesOpen: Number(payablesAgg._sum.amount ?? 0) - Number(payablesAgg._sum.paidAmount ?? 0),
    overdueReceivablesCount: overdueReceivables,
    byType: transactionsByType.map((t) => ({ type: t.type, total: Number(t._sum.amount ?? 0) })),
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

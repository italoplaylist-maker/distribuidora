import "server-only";
import { prisma } from "@/lib/database/prisma";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import type { Prisma } from "@prisma/client";

type ProductWithRelations = Prisma.ProductGetPayload<{ include: { category: true; brand: true } }>;

export interface ProductFilters {
  search?: string;
  /** @deprecated use stockFilter: "low" */
  lowStock?: boolean;
  stockFilter?: "low" | "zero" | "recent";
  categoryId?: string;
}

export const PRODUCTS_PAGE_SIZE = 50;
/** Safety cap while filtering by low/zero stock — Prisma can't compare two
 * columns (stock vs minStock) at the query-builder level, so that subset is
 * filtered in JS. Real catalogs rarely have more than a few hundred products
 * below their minimum at once; this cap just bounds the worst case. */
const STOCK_FILTER_SCAN_LIMIT = 1000;

export interface ProductListResult {
  items: ProductWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listProducts(companyId: string, filters: ProductFilters = {}, page = 1): Promise<ProductListResult> {
  const stockFilter = filters.stockFilter ?? (filters.lowStock ? "low" : undefined);
  const currentPage = Math.max(1, page);

  const where = {
    companyId,
    active: true,
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { sku: { contains: filters.search, mode: "insensitive" as const } },
            { barcode: { contains: filters.search } },
          ],
        }
      : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
  };

  if (stockFilter === "recent") {
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, brand: true },
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * PRODUCTS_PAGE_SIZE,
        take: PRODUCTS_PAGE_SIZE,
      }),
      prisma.product.count({ where }),
    ]);
    return { items, total, page: currentPage, pageSize: PRODUCTS_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)) };
  }

  if (stockFilter === "low" || stockFilter === "zero") {
    const scanned = await prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: { name: "asc" },
      take: STOCK_FILTER_SCAN_LIMIT,
    });
    const filtered =
      stockFilter === "zero"
        ? scanned.filter((p) => Number(p.stock) <= 0)
        : scanned.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= Number(p.minStock));
    const total = filtered.length;
    const items = filtered.slice((currentPage - 1) * PRODUCTS_PAGE_SIZE, currentPage * PRODUCTS_PAGE_SIZE);
    return { items, total, page: currentPage, pageSize: PRODUCTS_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)) };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: { name: "asc" },
      skip: (currentPage - 1) * PRODUCTS_PAGE_SIZE,
      take: PRODUCTS_PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page: currentPage, pageSize: PRODUCTS_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)) };
}

/** Loads a product scoped to the tenant. Throws NotFoundError (never leaks a cross-tenant record) if it belongs to another company. */
export async function getProductOrThrow(companyId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, companyId },
    include: { category: true, brand: true },
  });
  if (!product) throw new NotFoundError("Produto não encontrado");
  return product;
}

export async function listCategories(companyId: string) {
  return prisma.category.findMany({ where: { companyId }, orderBy: { name: "asc" } });
}

export async function listBrands(companyId: string) {
  return prisma.brand.findMany({ where: { companyId }, orderBy: { name: "asc" } });
}

export async function getProductStockHistory(companyId: string, productId: string) {
  await getProductOrThrow(companyId, productId);
  return prisma.stockMovement.findMany({
    where: { companyId, productId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/**
 * All-time sales performance for one product. Lucro gerado uses the
 * product's *current* average cost as the basis (this system doesn't track
 * per-lot historical cost), same simplification the dashboard's daily/
 * monthly profit figures already use — consistent, not fabricated.
 */
export async function getProductAnalytics(companyId: string, productId: string) {
  const [agg, last30Agg] = await Promise.all([
    prisma.saleItem.aggregate({
      where: { productId, sale: { companyId, status: "COMPLETED" } },
      _sum: { quantity: true, totalPrice: true },
      _count: true,
    }),
    prisma.saleItem.aggregate({
      where: { productId, sale: { companyId, status: "COMPLETED", createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } },
      _sum: { quantity: true, totalPrice: true },
    }),
  ]);

  return {
    unitsSoldTotal: Number(agg._sum.quantity ?? 0),
    revenueTotal: Number(agg._sum.totalPrice ?? 0),
    saleCount: agg._count,
    unitsSoldLast30: Number(last30Agg._sum.quantity ?? 0),
    revenueLast30: Number(last30Agg._sum.totalPrice ?? 0),
  };
}

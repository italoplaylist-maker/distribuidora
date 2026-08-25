import "server-only";
import { prisma } from "@/lib/database/prisma";
import { NotFoundError } from "@/lib/tenant/tenant-context";

export interface ProductFilters {
  search?: string;
  lowStock?: boolean;
  categoryId?: string;
}

export async function listProducts(companyId: string, filters: ProductFilters = {}) {
  return prisma.product.findMany({
    where: {
      companyId,
      active: true,
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { sku: { contains: filters.search, mode: "insensitive" } },
              { barcode: { contains: filters.search } },
            ],
          }
        : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    },
    include: { category: true, brand: true },
    orderBy: { name: "asc" },
  }).then((products) =>
    filters.lowStock ? products.filter((p) => Number(p.stock) <= Number(p.minStock)) : products,
  );
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

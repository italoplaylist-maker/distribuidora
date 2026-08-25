"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/guard";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { assertWithinPlanLimit } from "@/lib/tenant/limits";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { productSchema, stockAdjustSchema } from "@/schemas/product";
import { StockMovementType } from "@prisma/client";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

function nullifyEmpty(value: string | undefined) {
  return value && value.trim() !== "" ? value.trim() : null;
}

export async function createProductAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.PRODUCTS_CREATE);
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  await assertWithinPlanLimit(tenant.companyId, "products");

  const sku = nullifyEmpty(data.sku);
  if (sku) {
    const existing = await prisma.product.findFirst({ where: { companyId: tenant.companyId, sku } });
    if (existing) return { success: false, error: "Já existe um produto com este SKU" };
  }

  if (tenant.company.settings?.requireUniqueBarcode) {
    const barcode = nullifyEmpty(data.barcode);
    if (barcode) {
      const existing = await prisma.product.findFirst({ where: { companyId: tenant.companyId, barcode } });
      if (existing) return { success: false, error: "Já existe um produto com este código de barras" };
    }
  }

  const product = await prisma.product.create({
    data: {
      companyId: tenant.companyId,
      name: data.name,
      sku,
      barcode: nullifyEmpty(data.barcode),
      categoryId: data.categoryId || null,
      brandId: data.brandId || null,
      unit: data.unit,
      cost: data.cost,
      averageCost: data.cost,
      price: data.price,
      stock: data.stock,
      minStock: data.minStock,
      maxStock: data.maxStock,
      active: data.active,
    },
  });

  if (data.stock > 0) {
    await prisma.stockMovement.create({
      data: {
        companyId: tenant.companyId,
        productId: product.id,
        type: StockMovementType.ENTRADA,
        quantity: data.stock,
        balanceAfter: data.stock,
        reason: "Estoque inicial",
      },
    });
  }

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "product.create",
    entity: "Product",
    entityId: product.id,
    newData: { name: product.name, price: product.price.toString() },
  });

  revalidatePath("/dashboard/products");
  return { success: true, id: product.id };
}

export async function updateProductAction(productId: string, input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.PRODUCTS_UPDATE);
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const existing = await prisma.product.findFirst({ where: { id: productId, companyId: tenant.companyId } });
  if (!existing) throw new NotFoundError("Produto não encontrado");

  const sku = nullifyEmpty(data.sku);
  if (sku && sku !== existing.sku) {
    const dup = await prisma.product.findFirst({ where: { companyId: tenant.companyId, sku, id: { not: productId } } });
    if (dup) return { success: false, error: "Já existe um produto com este SKU" };
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      sku,
      barcode: nullifyEmpty(data.barcode),
      categoryId: data.categoryId || null,
      brandId: data.brandId || null,
      unit: data.unit,
      cost: data.cost,
      price: data.price,
      minStock: data.minStock,
      maxStock: data.maxStock,
      active: data.active,
    },
  });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "product.update",
    entity: "Product",
    entityId: productId,
    previousData: { price: existing.price.toString(), name: existing.name },
    newData: { price: updated.price.toString(), name: updated.name },
  });

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${productId}`);
  return { success: true, id: productId };
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.PRODUCTS_DELETE);
  const existing = await prisma.product.findFirst({ where: { id: productId, companyId: tenant.companyId } });
  if (!existing) throw new NotFoundError("Produto não encontrado");

  await prisma.product.update({ where: { id: productId }, data: { active: false, deletedAt: new Date() } });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "product.delete",
    entity: "Product",
    entityId: productId,
    previousData: { name: existing.name },
  });

  revalidatePath("/dashboard/products");
  return { success: true };
}

export async function adjustStockAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.STOCK_ADJUST);
  const parsed = stockAdjustSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({ where: { id: data.productId, companyId: tenant.companyId } });
    if (!product) throw new NotFoundError("Produto não encontrado");

    const newStock = Number(product.stock) + data.quantity;
    if (newStock < 0 && !tenant.company.settings?.allowNegativeStock) {
      throw new Error("Estoque insuficiente para este ajuste");
    }

    await tx.product.update({ where: { id: product.id }, data: { stock: newStock } });
    await tx.stockMovement.create({
      data: {
        companyId: tenant.companyId,
        productId: product.id,
        type: StockMovementType.AJUSTE,
        quantity: data.quantity,
        balanceAfter: newStock,
        reason: data.reason,
      },
    });
    return product;
  });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "stock.adjust",
    entity: "Product",
    entityId: result.id,
    newData: { quantity: data.quantity, reason: data.reason },
  });

  revalidatePath("/dashboard/products");
  revalidatePath(`/dashboard/products/${data.productId}`);
  return { success: true };
}

export async function createCategoryAction(name: string): Promise<ActionResult & { id?: string }> {
  const tenant = await requirePermission(PERMISSIONS.PRODUCTS_CREATE);
  if (!name.trim()) return { success: false, error: "Informe um nome" };
  const category = await prisma.category.upsert({
    where: { companyId_name: { companyId: tenant.companyId, name: name.trim() } },
    update: {},
    create: { companyId: tenant.companyId, name: name.trim() },
  });
  revalidatePath("/dashboard/products");
  return { success: true, id: category.id };
}

export async function createBrandAction(name: string): Promise<ActionResult & { id?: string }> {
  const tenant = await requirePermission(PERMISSIONS.PRODUCTS_CREATE);
  if (!name.trim()) return { success: false, error: "Informe um nome" };
  const brand = await prisma.brand.upsert({
    where: { companyId_name: { companyId: tenant.companyId, name: name.trim() } },
    update: {},
    create: { companyId: tenant.companyId, name: name.trim() },
  });
  revalidatePath("/dashboard/products");
  return { success: true, id: brand.id };
}

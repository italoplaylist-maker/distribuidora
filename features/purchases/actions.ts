"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, requireRead } from "@/lib/permissions/guard";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { purchaseSchema, cancelPurchaseSchema } from "@/schemas/purchase";
import { StockMovementType } from "@prisma/client";
import { searchSaleProducts } from "@/features/sales/queries";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function searchPurchaseProductsAction(query: string) {
  const tenant = await requireRead();
  const products = await searchSaleProducts(tenant.companyId, query);
  return products.map((p) => ({ id: p.id, name: p.name, cost: p.cost.toString(), stock: p.stock.toString(), unit: p.unit, sku: p.sku }));
}

export async function createPurchaseAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.PURCHASES_CREATE);
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  try {
    const purchaseId = await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findFirst({ where: { id: data.supplierId, companyId: tenant.companyId } });
      if (!supplier) throw new NotFoundError("Fornecedor não encontrado");

      const products = await tx.product.findMany({
        where: { companyId: tenant.companyId, id: { in: data.items.map((i) => i.productId) } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalAmount = 0;
      for (const item of data.items) {
        if (!productMap.has(item.productId)) throw new NotFoundError("Produto não encontrado");
        totalAmount += item.quantity * item.unitCost;
      }

      let cashRegister = null;
      if (data.paymentTerm === "CASH") {
        cashRegister = await tx.cashRegister.findFirst({ where: { companyId: tenant.companyId, status: "OPEN" } });
        if (!cashRegister) throw new Error("Nenhum caixa aberto. Abra o caixa antes de registrar compras à vista.");
      }

      const purchase = await tx.purchase.create({
        data: {
          companyId: tenant.companyId,
          supplierId: supplier.id,
          userId: tenant.userId,
          status: "RECEIVED",
          paymentTerm: data.paymentTerm,
          totalAmount,
          notes: data.notes,
        },
      });

      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        const lineTotal = item.quantity * item.unitCost;
        await tx.purchaseItem.create({
          data: { purchaseId: purchase.id, productId: product.id, quantity: item.quantity, unitCost: item.unitCost, totalCost: lineTotal },
        });

        const oldStock = Number(product.stock);
        const oldAvgCost = Number(product.averageCost);
        const newStock = oldStock + item.quantity;
        const newAvgCost = newStock > 0 ? (oldStock * oldAvgCost + item.quantity * item.unitCost) / newStock : item.unitCost;

        await tx.product.update({
          where: { id: product.id },
          data: { stock: newStock, averageCost: newAvgCost, cost: item.unitCost },
        });
        await tx.stockMovement.create({
          data: {
            companyId: tenant.companyId,
            productId: product.id,
            type: StockMovementType.COMPRA,
            quantity: item.quantity,
            balanceAfter: newStock,
            purchaseId: purchase.id,
          },
        });
      }

      if (data.paymentTerm === "CREDIT") {
        await tx.accountPayable.create({
          data: {
            companyId: tenant.companyId,
            purchaseId: purchase.id,
            description: `Compra #${purchase.id.slice(-6)} - ${supplier.name}`,
            amount: totalAmount,
            dueDate: new Date(Date.now() + (tenant.company.settings?.defaultPaymentTermDays ?? 30) * 24 * 60 * 60 * 1000),
            status: "OPEN",
          },
        });
      } else if (cashRegister) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId: cashRegister.id,
            type: "DESPESA",
            amount: -totalAmount,
            description: `Compra #${purchase.id.slice(-6)} - ${supplier.name}`,
          },
        });
        await tx.cashRegister.update({ where: { id: cashRegister.id }, data: { expectedBalance: { decrement: totalAmount } } });
      }

      return purchase.id;
    });

    await recordAudit({
      companyId: tenant.companyId,
      userId: tenant.userId,
      action: "purchase.create",
      entity: "Purchase",
      entityId: purchaseId,
      newData: { supplierId: data.supplierId, itemCount: data.items.length },
    });

    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");
    return { success: true, id: purchaseId };
  } catch (err) {
    if (err instanceof NotFoundError) return { success: false, error: err.message };
    if (err instanceof Error) return { success: false, error: err.message };
    throw err;
  }
}

export async function cancelPurchaseAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.PURCHASES_CANCEL);
  const parsed = cancelPurchaseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: { id: data.purchaseId, companyId: tenant.companyId },
        include: { items: true, accountsPayable: true },
      });
      if (!purchase) throw new NotFoundError("Compra não encontrada");
      if (purchase.status === "CANCELED") throw new Error("Compra já está cancelada");

      const payable = purchase.accountsPayable[0];
      if (payable && Number(payable.paidAmount) > 0) {
        throw new Error("Não é possível cancelar: já existem pagamentos para esta compra");
      }

      for (const item of purchase.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const newStock = Number(product.stock) - Number(item.quantity);
        if (newStock < 0 && !tenant.company.settings?.allowNegativeStock) {
          throw new Error(`Não é possível cancelar: estoque de ${product.name} já foi consumido`);
        }
        await tx.product.update({ where: { id: product.id }, data: { stock: newStock } });
        await tx.stockMovement.create({
          data: {
            companyId: tenant.companyId,
            productId: product.id,
            type: StockMovementType.AJUSTE,
            quantity: -Number(item.quantity),
            balanceAfter: newStock,
            purchaseId: purchase.id,
            reason: `Cancelamento da compra #${purchase.id.slice(-6)}: ${data.reason}`,
          },
        });
      }

      if (payable) {
        await tx.accountPayable.update({ where: { id: payable.id }, data: { status: "CANCELED", canceledAt: new Date() } });
      }

      await tx.purchase.update({ where: { id: purchase.id }, data: { status: "CANCELED", canceledAt: new Date(), cancelReason: data.reason } });
    });

    await recordAudit({
      companyId: tenant.companyId,
      userId: tenant.userId,
      action: "purchase.cancel",
      entity: "Purchase",
      entityId: data.purchaseId,
      newData: { reason: data.reason },
    });

    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (err) {
    if (err instanceof NotFoundError) return { success: false, error: err.message };
    if (err instanceof Error) return { success: false, error: err.message };
    throw err;
  }
}

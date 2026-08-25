"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, requireRead } from "@/lib/permissions/guard";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions/permissions";
import { NotFoundError, ForbiddenError } from "@/lib/tenant/tenant-context";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { saleSchema, cancelSaleSchema } from "@/schemas/sale";
import { StockMovementType } from "@prisma/client";
import { searchSaleProducts } from "@/features/sales/queries";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function searchProductsAction(query: string) {
  const tenant = await requireRead();
  const products = await searchSaleProducts(tenant.companyId, query);
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price.toString(),
    stock: p.stock.toString(),
    unit: p.unit,
    sku: p.sku,
  }));
}

export async function getProductByIdAction(productId: string) {
  const tenant = await requireRead();
  const product = await prisma.product.findFirst({ where: { id: productId, companyId: tenant.companyId } });
  if (!product) return null;
  return { id: product.id, name: product.name, price: product.price.toString(), stock: product.stock.toString(), unit: product.unit, sku: product.sku };
}

export async function createSaleAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.SALES_CREATE);
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  if (data.discount > 0 && !roleHasPermission(tenant.role, PERMISSIONS.SALES_DISCOUNT)) {
    return { success: false, error: "Você não tem permissão para aplicar desconto" };
  }

  const isFiado = data.paymentMethod === "fiado";
  if (isFiado && !data.customerId) {
    return { success: false, error: "Selecione um cliente para venda fiado" };
  }

  try {
    const saleId = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { companyId: tenant.companyId, id: { in: data.items.map((i) => i.productId) } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new NotFoundError("Produto não encontrado");
        const available = Number(product.stock);
        if (available < item.quantity && !tenant.company.settings?.allowNegativeStock) {
          throw new Error(`Estoque insuficiente para ${product.name}`);
        }
        subtotal += Number(product.price) * item.quantity;
      }

      const totalAmount = Math.max(0, subtotal - data.discount);

      let customer = null;
      if (data.customerId) {
        customer = await tx.customer.findFirst({ where: { id: data.customerId, companyId: tenant.companyId } });
        if (!customer) throw new NotFoundError("Cliente não encontrado");
      }

      if (isFiado && customer) {
        const openReceivables = await tx.accountReceivable.aggregate({
          where: { companyId: tenant.companyId, customerId: customer.id, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
          _sum: { amount: true, paidAmount: true },
        });
        const currentOpen = Number(openReceivables._sum.amount ?? 0) - Number(openReceivables._sum.paidAmount ?? 0);
        const limit = Number(customer.creditLimit);
        if (limit <= 0 || currentOpen + totalAmount > limit) {
          throw new ForbiddenError(`Cliente acima do limite de crédito (limite: ${limit.toFixed(2)})`);
        }
      }

      let cashRegister = null;
      if (!isFiado) {
        cashRegister = await tx.cashRegister.findFirst({ where: { companyId: tenant.companyId, status: "OPEN" } });
        if (!cashRegister) throw new Error("Nenhum caixa aberto. Abra o caixa antes de registrar vendas à vista.");
      }

      const sale = await tx.sale.create({
        data: {
          companyId: tenant.companyId,
          customerId: customer?.id,
          userId: tenant.userId,
          paymentTerm: isFiado ? "CREDIT" : "CASH",
          paymentMethod: data.paymentMethod,
          subtotal,
          discount: data.discount,
          totalAmount,
        },
      });

      for (const item of data.items) {
        const product = productMap.get(item.productId)!;
        const lineTotal = Number(product.price) * item.quantity;
        await tx.saleItem.create({
          data: { saleId: sale.id, productId: product.id, quantity: item.quantity, unitPrice: product.price, totalPrice: lineTotal },
        });
        const newStock = Number(product.stock) - item.quantity;
        await tx.product.update({ where: { id: product.id }, data: { stock: newStock } });
        await tx.stockMovement.create({
          data: {
            companyId: tenant.companyId,
            productId: product.id,
            type: StockMovementType.VENDA,
            quantity: -item.quantity,
            balanceAfter: newStock,
            saleId: sale.id,
          },
        });
      }

      if (isFiado && customer) {
        await tx.accountReceivable.create({
          data: {
            companyId: tenant.companyId,
            customerId: customer.id,
            saleId: sale.id,
            description: `Venda #${sale.id.slice(-6)}`,
            amount: totalAmount,
            dueDate: new Date(Date.now() + (tenant.company.settings?.defaultPaymentTermDays ?? 30) * 24 * 60 * 60 * 1000),
            status: "OPEN",
          },
        });
      } else if (cashRegister) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId: cashRegister.id,
            saleId: sale.id,
            type: "VENDA",
            amount: totalAmount,
            description: `Venda #${sale.id.slice(-6)}`,
          },
        });
        await tx.cashRegister.update({ where: { id: cashRegister.id }, data: { expectedBalance: { increment: totalAmount } } });
      }

      return sale.id;
    });

    await recordAudit({
      companyId: tenant.companyId,
      userId: tenant.userId,
      action: "sale.create",
      entity: "Sale",
      entityId: saleId,
      newData: { paymentMethod: data.paymentMethod, itemCount: data.items.length },
    });

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard");
    return { success: true, id: saleId };
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ForbiddenError) {
      return { success: false, error: err.message };
    }
    if (err instanceof Error) return { success: false, error: err.message };
    throw err;
  }
}

export async function cancelSaleAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.SALES_CANCEL);
  const parsed = cancelSaleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: data.saleId, companyId: tenant.companyId },
        include: { items: true, accountsReceivable: true, cashMovements: true },
      });
      if (!sale) throw new NotFoundError("Venda não encontrada");
      if (sale.status === "CANCELED") throw new Error("Venda já está cancelada");

      const receivable = sale.accountsReceivable[0];
      if (receivable && Number(receivable.paidAmount) > 0) {
        throw new Error("Não é possível cancelar: já existem recebimentos para esta venda");
      }

      for (const item of sale.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const newStock = Number(product.stock) + Number(item.quantity);
        await tx.product.update({ where: { id: product.id }, data: { stock: newStock } });
        await tx.stockMovement.create({
          data: {
            companyId: tenant.companyId,
            productId: product.id,
            type: StockMovementType.DEVOLUCAO,
            quantity: item.quantity,
            balanceAfter: newStock,
            saleId: sale.id,
            reason: `Cancelamento da venda #${sale.id.slice(-6)}: ${data.reason}`,
          },
        });
      }

      if (receivable) {
        await tx.accountReceivable.update({ where: { id: receivable.id }, data: { status: "CANCELED", canceledAt: new Date() } });
      }

      const originalCashMovement = sale.cashMovements[0];
      if (originalCashMovement) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId: originalCashMovement.cashRegisterId,
            saleId: sale.id,
            type: "DESPESA",
            amount: -Number(sale.totalAmount),
            description: `Estorno venda #${sale.id.slice(-6)} cancelada`,
          },
        });
        const register = await tx.cashRegister.findUnique({ where: { id: originalCashMovement.cashRegisterId } });
        if (register?.status === "OPEN") {
          await tx.cashRegister.update({ where: { id: register.id }, data: { expectedBalance: { decrement: Number(sale.totalAmount) } } });
        }
      }

      await tx.sale.update({ where: { id: sale.id }, data: { status: "CANCELED", canceledAt: new Date(), cancelReason: data.reason } });
    });

    await recordAudit({
      companyId: tenant.companyId,
      userId: tenant.userId,
      action: "sale.cancel",
      entity: "Sale",
      entityId: data.saleId,
      newData: { reason: data.reason },
    });

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (err) {
    if (err instanceof NotFoundError) return { success: false, error: err.message };
    if (err instanceof Error) return { success: false, error: err.message };
    throw err;
  }
}

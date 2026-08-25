"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/guard";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import {
  paymentSchema,
  openCashRegisterSchema,
  closeCashRegisterSchema,
  cashMovementSchema,
} from "@/schemas/finance";

export interface ActionResult {
  success: boolean;
  error?: string;
  id?: string;
}

export async function payReceivableAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.FINANCE_RECEIVE);
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const receivable = await tx.accountReceivable.findFirst({ where: { id: data.id, companyId: tenant.companyId } });
      if (!receivable) throw new NotFoundError("Conta a receber não encontrada");
      if (receivable.status === "PAID" || receivable.status === "CANCELED") throw new Error("Esta conta não pode receber pagamentos");

      const remaining = Number(receivable.amount) - Number(receivable.paidAmount);
      if (data.amount > remaining) throw new Error(`Valor maior que o saldo em aberto (${remaining.toFixed(2)})`);

      const newPaid = Number(receivable.paidAmount) + data.amount;
      const newStatus = newPaid >= Number(receivable.amount) ? "PAID" : "PARTIALLY_PAID";

      await tx.accountReceivable.update({
        where: { id: receivable.id },
        data: { paidAmount: newPaid, status: newStatus, paidAt: newStatus === "PAID" ? new Date() : receivable.paidAt },
      });

      await tx.financialTransaction.create({
        data: { companyId: tenant.companyId, type: "RECEIPT", amount: data.amount, description: receivable.description, accountReceivableId: receivable.id },
      });

      const cashRegister = await tx.cashRegister.findFirst({ where: { companyId: tenant.companyId, status: "OPEN" } });
      if (cashRegister) {
        await tx.cashMovement.create({
          data: { cashRegisterId: cashRegister.id, type: "RECEBIMENTO", amount: data.amount, description: receivable.description },
        });
        await tx.cashRegister.update({ where: { id: cashRegister.id }, data: { expectedBalance: { increment: data.amount } } });
      }
    });

    await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: "receivable.pay", entity: "AccountReceivable", entityId: data.id, newData: { amount: data.amount } });

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/finance/receivables");
    return { success: true };
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof Error) return { success: false, error: err.message };
    throw err;
  }
}

export async function payPayableAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.FINANCE_PAY);
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const payable = await tx.accountPayable.findFirst({ where: { id: data.id, companyId: tenant.companyId } });
      if (!payable) throw new NotFoundError("Conta a pagar não encontrada");
      if (payable.status === "PAID" || payable.status === "CANCELED") throw new Error("Esta conta não pode receber pagamentos");

      const remaining = Number(payable.amount) - Number(payable.paidAmount);
      if (data.amount > remaining) throw new Error(`Valor maior que o saldo em aberto (${remaining.toFixed(2)})`);

      const newPaid = Number(payable.paidAmount) + data.amount;
      const newStatus = newPaid >= Number(payable.amount) ? "PAID" : "PARTIALLY_PAID";

      await tx.accountPayable.update({
        where: { id: payable.id },
        data: { paidAmount: newPaid, status: newStatus, paidAt: newStatus === "PAID" ? new Date() : payable.paidAt },
      });

      await tx.financialTransaction.create({
        data: { companyId: tenant.companyId, type: "PAYMENT", amount: data.amount, description: payable.description, accountPayableId: payable.id },
      });

      const cashRegister = await tx.cashRegister.findFirst({ where: { companyId: tenant.companyId, status: "OPEN" } });
      if (cashRegister) {
        await tx.cashMovement.create({
          data: { cashRegisterId: cashRegister.id, type: "DESPESA", amount: -data.amount, description: payable.description },
        });
        await tx.cashRegister.update({ where: { id: cashRegister.id }, data: { expectedBalance: { decrement: data.amount } } });
      }
    });

    await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: "payable.pay", entity: "AccountPayable", entityId: data.id, newData: { amount: data.amount } });

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/finance/payables");
    return { success: true };
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof Error) return { success: false, error: err.message };
    throw err;
  }
}

export async function openCashRegisterAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.CASH_MANAGE);
  const parsed = openCashRegisterSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const existing = await prisma.cashRegister.findFirst({ where: { companyId: tenant.companyId, status: "OPEN" } });
  if (existing) return { success: false, error: "Já existe um caixa aberto" };

  const cashRegister = await prisma.cashRegister.create({
    data: { companyId: tenant.companyId, userId: tenant.userId, openingBalance: data.openingBalance, expectedBalance: data.openingBalance },
  });
  await prisma.cashMovement.create({
    data: { cashRegisterId: cashRegister.id, type: "ABERTURA", amount: data.openingBalance, description: "Abertura de caixa" },
  });

  await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: "cash.open", entity: "CashRegister", entityId: cashRegister.id, newData: { openingBalance: data.openingBalance } });

  revalidatePath("/dashboard/finance/cash");
  return { success: true, id: cashRegister.id };
}

export async function closeCashRegisterAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.CASH_MANAGE);
  const parsed = closeCashRegisterSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const cashRegister = await prisma.cashRegister.findFirst({ where: { id: data.cashRegisterId, companyId: tenant.companyId, status: "OPEN" } });
  if (!cashRegister) throw new NotFoundError("Caixa não encontrado ou já fechado");

  const difference = data.informedBalance - Number(cashRegister.expectedBalance);

  await prisma.cashRegister.update({
    where: { id: cashRegister.id },
    data: { status: "CLOSED", informedBalance: data.informedBalance, difference, closedAt: new Date() },
  });

  await recordAudit({
    companyId: tenant.companyId,
    userId: tenant.userId,
    action: "cash.close",
    entity: "CashRegister",
    entityId: cashRegister.id,
    newData: { informedBalance: data.informedBalance, difference },
  });

  revalidatePath("/dashboard/finance/cash");
  return { success: true };
}

export async function createCashMovementAction(input: unknown): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.CASH_MANAGE);
  const parsed = cashMovementSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const cashRegister = await prisma.cashRegister.findFirst({ where: { companyId: tenant.companyId, status: "OPEN" } });
  if (!cashRegister) return { success: false, error: "Nenhum caixa aberto" };

  const signedAmount = data.type === "SANGRIA" ? -data.amount : data.amount;

  await prisma.cashMovement.create({
    data: { cashRegisterId: cashRegister.id, type: data.type, amount: signedAmount, description: data.description },
  });
  await prisma.cashRegister.update({
    where: { id: cashRegister.id },
    data: { expectedBalance: { increment: signedAmount } },
  });

  await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: `cash.${data.type.toLowerCase()}`, entity: "CashRegister", entityId: cashRegister.id, newData: { amount: data.amount, description: data.description } });

  revalidatePath("/dashboard/finance/cash");
  return { success: true };
}

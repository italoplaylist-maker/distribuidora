import "server-only";
import { prisma } from "@/lib/database/prisma";
import { brazilDateKey, startOfDayBrazil, addDaysBrazil } from "@/lib/timezone";

const SETTLED_ACCOUNTS_LIMIT = 50;

/**
 * Open/overdue accounts are returned unbounded — a real business only ever
 * has a handful to a few hundred outstanding at once. Settled (paid/
 * canceled) accounts accumulate forever, so that history is capped instead
 * of loading years of closed accounts on every page view.
 */
export async function listReceivables(companyId: string) {
  const [open, settled] = await Promise.all([
    prisma.accountReceivable.findMany({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] } },
      include: { customer: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.accountReceivable.findMany({
      where: { companyId, status: { in: ["PAID", "CANCELED"] } },
      include: { customer: true },
      orderBy: { updatedAt: "desc" },
      take: SETTLED_ACCOUNTS_LIMIT,
    }),
  ]);
  return { open, settled };
}

export async function listPayables(companyId: string) {
  const [open, settled] = await Promise.all([
    prisma.accountPayable.findMany({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] } },
      include: { purchase: { include: { supplier: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.accountPayable.findMany({
      where: { companyId, status: { in: ["PAID", "CANCELED"] } },
      include: { purchase: { include: { supplier: true } } },
      orderBy: { updatedAt: "desc" },
      take: SETTLED_ACCOUNTS_LIMIT,
    }),
  ]);
  return { open, settled };
}

export async function getOpenCashRegister(companyId: string) {
  return prisma.cashRegister.findFirst({
    where: { companyId, status: "OPEN" },
    include: { movements: { orderBy: { createdAt: "desc" } }, user: true },
    orderBy: { openedAt: "desc" },
  });
}

export async function getCashRegisterHistory(companyId: string) {
  return prisma.cashRegister.findMany({
    where: { companyId, status: "CLOSED" },
    include: { user: true },
    orderBy: { closedAt: "desc" },
    take: 20,
  });
}

export async function getFinanceSummary(companyId: string) {
  const [receivablesAgg, payablesAgg] = await Promise.all([
    prisma.accountReceivable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
  ]);

  return {
    receivablesOpen: Number(receivablesAgg._sum.amount ?? 0) - Number(receivablesAgg._sum.paidAmount ?? 0),
    payablesOpen: Number(payablesAgg._sum.amount ?? 0) - Number(payablesAgg._sum.paidAmount ?? 0),
  };
}

/**
 * Liquidity snapshot. "Disponível" is the sum of expected balances of any
 * currently open cash registers — this system has no separate bank-account
 * ledger, so cash-on-hand is the only real-time "available money" figure
 * that exists in the data. Everything else is computed from real accounts
 * receivable/payable, never estimated.
 */
export async function getLiquiditySummary(companyId: string) {
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400000);
  const in30 = new Date(now.getTime() + 30 * 86400000);

  const [openRegisters, receivablesAgg, payablesAgg, receivables7, receivables30, payables7, payables30] = await Promise.all([
    prisma.cashRegister.findMany({ where: { companyId, status: "OPEN" }, select: { expectedBalance: true } }),
    prisma.accountReceivable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID", "OVERDUE"] } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountReceivable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] }, dueDate: { lte: in7 } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountReceivable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] }, dueDate: { lte: in30 } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] }, dueDate: { lte: in7 } },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.accountPayable.aggregate({
      where: { companyId, status: { in: ["OPEN", "PARTIALLY_PAID"] }, dueDate: { lte: in30 } },
      _sum: { amount: true, paidAmount: true },
    }),
  ]);

  const disponivel = openRegisters.reduce((sum, r) => sum + Number(r.expectedBalance), 0);
  const aReceber = Number(receivablesAgg._sum.amount ?? 0) - Number(receivablesAgg._sum.paidAmount ?? 0);
  const aPagar = Number(payablesAgg._sum.amount ?? 0) - Number(payablesAgg._sum.paidAmount ?? 0);
  const saldoProjetado = disponivel + aReceber - aPagar;

  const net = (agg: { _sum: { amount: unknown; paidAmount: unknown } }) => Number(agg._sum.amount ?? 0) - Number(agg._sum.paidAmount ?? 0);

  return {
    disponivel,
    aReceber,
    aPagar,
    saldoProjetado,
    liquidezAtual: aPagar > 0 ? disponivel / aPagar : null,
    liquidezProjetada: aPagar > 0 ? (disponivel + aReceber) / aPagar : null,
    proximos7: { aReceber: net(receivables7), aPagar: net(payables7) },
    proximos30: { aReceber: net(receivables30), aPagar: net(payables30) },
  };
}

const CASH_FLOW_PERIOD_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;
export type CashFlowPeriod = keyof typeof CASH_FLOW_PERIOD_DAYS;

/**
 * Real cash-basis flow, built from CashMovement — the one ledger every
 * cash-affecting action already writes to (sales, receivable/payable
 * payments, cash purchases, sangria/suprimento). Excludes ABERTURA entries:
 * an opening balance carry-over isn't period income.
 */
export async function getCashFlow(companyId: string, period: CashFlowPeriod = "30d") {
  const days = CASH_FLOW_PERIOD_DAYS[period];
  const start = addDaysBrazil(startOfDayBrazil(), -(days - 1));

  const movements = await prisma.cashMovement.findMany({
    where: { cashRegister: { companyId }, type: { not: "ABERTURA" }, createdAt: { gte: start } },
    select: { type: true, amount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const buckets = new Map<string, { entradas: number; saidas: number }>();
  const bucketDays = days <= 14 ? days : Math.min(days, 30);
  const step = Math.ceil(days / bucketDays);
  for (let i = days - 1; i >= 0; i -= step) {
    const d = new Date(start.getTime() + (days - 1 - i) * 86400000);
    buckets.set(brazilDateKey(d), { entradas: 0, saidas: 0 });
  }
  const bucketKeys = [...buckets.keys()].sort();

  function keyFor(date: Date) {
    const iso = brazilDateKey(date);
    let match = bucketKeys[0];
    for (const k of bucketKeys) {
      if (k <= iso) match = k;
      else break;
    }
    return match;
  }

  let totalEntradas = 0;
  let totalSaidas = 0;
  for (const m of movements) {
    const amount = Number(m.amount);
    const bucket = buckets.get(keyFor(m.createdAt));
    if (amount >= 0) {
      totalEntradas += amount;
      if (bucket) bucket.entradas += amount;
    } else {
      totalSaidas += -amount;
      if (bucket) bucket.saidas += -amount;
    }
  }

  const byType = new Map<string, number>();
  for (const m of movements) {
    byType.set(m.type, (byType.get(m.type) ?? 0) + Number(m.amount));
  }

  return {
    points: bucketKeys.map((key) => {
      const [, month, day] = key.split("-");
      return {
        label: `${day}/${month}`,
        entradas: buckets.get(key)!.entradas,
        saidas: buckets.get(key)!.saidas,
      };
    }),
    totalEntradas,
    totalSaidas,
    saldoPeriodo: totalEntradas - totalSaidas,
    byType: [...byType.entries()].map(([type, total]) => ({ type, total })),
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/permissions/guard";
import { PERMISSIONS } from "@/lib/permissions/permissions";
import { recordAudit } from "@/lib/audit/audit";
import { prisma } from "@/lib/database/prisma";
import { getPaymentProvider } from "@/lib/payments/provider";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function subscribeToPlanAction(planId: string, billingCycle: "monthly" | "yearly"): Promise<ActionResult> {
  const tenant = await requirePermission(PERMISSIONS.COMPANY_SETTINGS);

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.active) return { success: false, error: "Plano inválido" };

  const provider = getPaymentProvider();
  const { externalSubscriptionId } = await provider.createSubscription({
    companyId: tenant.companyId,
    planId,
    billingCycle,
    customerEmail: tenant.company.email,
    customerName: tenant.company.nomeFantasia,
  });

  const now = new Date();
  const periodEnd = new Date(now.getTime() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000);
  const amount = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { companyId: tenant.companyId },
      update: {
        planId,
        status: "ACTIVE",
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentProvider: provider.name,
        externalSubscriptionId,
      },
      create: {
        companyId: tenant.companyId,
        planId,
        status: "ACTIVE",
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paymentProvider: provider.name,
        externalSubscriptionId,
      },
    }),
    prisma.company.update({ where: { id: tenant.companyId }, data: { status: "ACTIVE" } }),
    prisma.payment.create({
      data: {
        companyId: tenant.companyId,
        amount,
        status: "PAID",
        provider: provider.name,
        externalPaymentId: `${externalSubscriptionId}_initial`,
        method: "manual",
        paidAt: now,
      },
    }),
  ]);

  await recordAudit({ companyId: tenant.companyId, userId: tenant.userId, action: "subscription.activate", entity: "Subscription", entityId: tenant.companyId, newData: { planId, billingCycle } });

  revalidatePath("/dashboard/settings/billing");
  revalidatePath("/dashboard");
  return { success: true };
}

import "server-only";
import { prisma } from "@/lib/database/prisma";
import { ForbiddenError } from "@/lib/tenant/tenant-context";

export type LimitedResource = "users" | "products" | "customers" | "suppliers";

/** Feature flags gated by the company's plan (see Plan.features). */
export async function hasFeature(companyId: string, feature: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });
  return sub?.plan.features.includes(feature) ?? false;
}

/**
 * Throws when creating one more of `resource` would exceed the company's
 * plan limit. Call this inside the same transaction/flow right before
 * creating the record so counts stay accurate under concurrency.
 */
export async function assertWithinPlanLimit(companyId: string, resource: LimitedResource) {
  const sub = await prisma.subscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });
  if (!sub) throw new ForbiddenError("Empresa sem assinatura ativa");

  const plan = sub.plan;
  const limitMap: Record<LimitedResource, number> = {
    users: plan.maxUsers,
    products: plan.maxProducts,
    customers: plan.maxCustomers,
    suppliers: plan.maxSuppliers,
  };
  const limit = limitMap[resource];
  if (limit < 0) return; // unlimited (-1)

  const countMap: Record<LimitedResource, () => Promise<number>> = {
    users: () => prisma.user.count({ where: { companyId, active: true } }),
    products: () => prisma.product.count({ where: { companyId, active: true } }),
    customers: () => prisma.customer.count({ where: { companyId, active: true } }),
    suppliers: () => prisma.supplier.count({ where: { companyId, active: true } }),
  };

  const current = await countMap[resource]();
  if (current >= limit) {
    const labels: Record<LimitedResource, string> = {
      users: "usuários",
      products: "produtos",
      customers: "clientes",
      suppliers: "fornecedores",
    };
    throw new ForbiddenError(
      `Limite de ${labels[resource]} atingido. Seu plano permite até ${limit}. Faça upgrade para continuar.`,
    );
  }
}

/**
 * One-off data migration: collapses every existing Plan into a single
 * standard plan ("Padrão", slug "padrao"). The product no longer exposes
 * plan configuration or pricing anywhere in the UI, so having several
 * Plan rows with different limits/prices around is just confusing state.
 *
 * Safe to run more than once (idempotent): if "padrao" already exists and
 * is the only plan, this is a no-op.
 *
 * Usage: npx tsx prisma/scripts/consolidate-plans.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  let padrao = plans.find((p) => p.slug === "padrao");
  if (!padrao) {
    padrao = await prisma.plan.create({
      data: {
        name: "Padrão",
        slug: "padrao",
        description: "Plano padrão da plataforma",
        priceMonthly: 0,
        priceYearly: 0,
        maxUsers: 20,
        maxProducts: 10000,
        maxCustomers: 10000,
        maxSuppliers: 500,
        maxStorageMb: 20480,
        features: [],
        sortOrder: 1,
      },
    });
    console.log(`Criado plano padrão: ${padrao.id}`);
  }

  const otherPlans = plans.filter((p) => p.id !== padrao!.id);
  if (otherPlans.length === 0) {
    console.log("Nenhum outro plano para consolidar. Nada a fazer.");
    return;
  }

  const otherPlanIds = otherPlans.map((p) => p.id);

  const { count } = await prisma.subscription.updateMany({
    where: { planId: { in: otherPlanIds } },
    data: { planId: padrao.id },
  });
  console.log(`${count} assinatura(s) repontada(s) para o plano padrão.`);

  const { count: deleted } = await prisma.plan.deleteMany({ where: { id: { in: otherPlanIds } } });
  console.log(`${deleted} plano(s) antigo(s) removido(s): ${otherPlans.map((p) => p.name).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

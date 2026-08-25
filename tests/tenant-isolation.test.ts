import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let companyA: { id: string };
let companyB: { id: string };

beforeAll(async () => {
  const companies = await prisma.company.findMany({ orderBy: { createdAt: "asc" }, take: 2 });
  if (companies.length < 2) throw new Error("Seed data with at least 2 companies is required for these tests (run `npm run db:seed`)");
  [companyA, companyB] = companies;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("multi-tenant data isolation", () => {
  it("never returns another company's product when scoped by companyId", async () => {
    const productOfA = await prisma.product.findFirst({ where: { companyId: companyA.id } });
    expect(productOfA).not.toBeNull();

    // Simulates the exact guard every query/action must apply: filter by companyId.
    const crossTenantLookup = await prisma.product.findFirst({ where: { id: productOfA!.id, companyId: companyB.id } });
    expect(crossTenantLookup).toBeNull();
  });

  it("never returns another company's customer, supplier or sale when scoped by companyId", async () => {
    const [customerA, supplierA, saleA] = await Promise.all([
      prisma.customer.findFirst({ where: { companyId: companyA.id } }),
      prisma.supplier.findFirst({ where: { companyId: companyA.id } }),
      prisma.sale.findFirst({ where: { companyId: companyA.id } }),
    ]);

    expect(customerA).not.toBeNull();
    expect(supplierA).not.toBeNull();
    expect(saleA).not.toBeNull();

    await expect(prisma.customer.findFirst({ where: { id: customerA!.id, companyId: companyB.id } })).resolves.toBeNull();
    await expect(prisma.supplier.findFirst({ where: { id: supplierA!.id, companyId: companyB.id } })).resolves.toBeNull();
    await expect(prisma.sale.findFirst({ where: { id: saleA!.id, companyId: companyB.id } })).resolves.toBeNull();
  });

  it("allows two companies to use the same product SKU independently", async () => {
    const sharedSku = `TEST-SHARED-SKU-${Date.now()}`;

    const [productA, productB] = await Promise.all([
      prisma.product.create({ data: { companyId: companyA.id, name: "Produto teste A", sku: sharedSku, unit: "UN", cost: 1, averageCost: 1, price: 2 } }),
      prisma.product.create({ data: { companyId: companyB.id, name: "Produto teste B", sku: sharedSku, unit: "UN", cost: 1, averageCost: 1, price: 2 } }),
    ]);

    expect(productA.sku).toBe(sharedSku);
    expect(productB.sku).toBe(sharedSku);
    expect(productA.companyId).not.toBe(productB.companyId);

    await prisma.product.deleteMany({ where: { id: { in: [productA.id, productB.id] } } });
  });

  it("rejects a duplicate SKU within the same company", async () => {
    const sku = `TEST-DUP-SKU-${Date.now()}`;
    const created = await prisma.product.create({
      data: { companyId: companyA.id, name: "Produto duplicado 1", sku, unit: "UN", cost: 1, averageCost: 1, price: 2 },
    });

    await expect(
      prisma.product.create({
        data: { companyId: companyA.id, name: "Produto duplicado 2", sku, unit: "UN", cost: 1, averageCost: 1, price: 2 },
      }),
    ).rejects.toThrow();

    await prisma.product.delete({ where: { id: created.id } });
  });

  it("keeps stock movements, accounts and cash registers scoped to their own company", async () => {
    const [movementA, payableA, cashA] = await Promise.all([
      prisma.stockMovement.findFirst({ where: { companyId: companyA.id } }),
      prisma.accountPayable.findFirst({ where: { companyId: companyA.id } }),
      prisma.cashRegister.findFirst({ where: { companyId: companyA.id } }),
    ]);

    if (movementA) {
      await expect(prisma.stockMovement.findFirst({ where: { id: movementA.id, companyId: companyB.id } })).resolves.toBeNull();
    }
    if (payableA) {
      await expect(prisma.accountPayable.findFirst({ where: { id: payableA.id, companyId: companyB.id } })).resolves.toBeNull();
    }
    if (cashA) {
      await expect(prisma.cashRegister.findFirst({ where: { id: cashA.id, companyId: companyB.id } })).resolves.toBeNull();
    }
  });
});

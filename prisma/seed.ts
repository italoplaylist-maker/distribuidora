import { PrismaClient, CompanyRole, PaymentTerm, StockMovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@123";

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

const PRODUCT_CATALOG = [
  { name: "Original 600ml", category: "Cerveja", brand: "Original", unit: "UN", cost: 4.2, price: 8.5 },
  { name: "Original Long Neck 355ml", category: "Cerveja", brand: "Original", unit: "UN", cost: 3.1, price: 6.5 },
  { name: "Brahma Duplo Malte 350ml", category: "Cerveja", brand: "Brahma", unit: "UN", cost: 2.6, price: 5.5 },
  { name: "Brahma Chopp Lata 350ml", category: "Cerveja", brand: "Brahma", unit: "UN", cost: 2.4, price: 5.0 },
  { name: "Skol Lata 350ml", category: "Cerveja", brand: "Skol", unit: "UN", cost: 2.3, price: 4.8 },
  { name: "Skol Garrafa 600ml", category: "Cerveja", brand: "Skol", unit: "UN", cost: 4.0, price: 8.0 },
  { name: "Heineken Long Neck 330ml", category: "Cerveja", brand: "Heineken", unit: "UN", cost: 5.5, price: 10.9 },
  { name: "Heineken Lata 350ml", category: "Cerveja", brand: "Heineken", unit: "UN", cost: 4.8, price: 9.5 },
  { name: "Coca-Cola 2L", category: "Refrigerante", brand: "Coca-Cola", unit: "UN", cost: 6.5, price: 11.9 },
  { name: "Coca-Cola Lata 350ml", category: "Refrigerante", brand: "Coca-Cola", unit: "UN", cost: 2.8, price: 5.5 },
  { name: "Guaraná Antarctica 2L", category: "Refrigerante", brand: "Guaraná", unit: "UN", cost: 5.8, price: 10.5 },
  { name: "Guaraná Antarctica Lata 350ml", category: "Refrigerante", brand: "Guaraná", unit: "UN", cost: 2.5, price: 5.0 },
  { name: "Fanta Laranja 2L", category: "Refrigerante", brand: "Fanta", unit: "UN", cost: 5.6, price: 10.0 },
  { name: "Sprite 2L", category: "Refrigerante", brand: "Sprite", unit: "UN", cost: 5.6, price: 10.0 },
  { name: "Água Mineral 500ml", category: "Água", brand: "Água", unit: "UN", cost: 0.9, price: 2.5 },
  { name: "Água com Gás 500ml", category: "Água", brand: "Água", unit: "UN", cost: 1.1, price: 3.0 },
  { name: "Energético Lata 250ml", category: "Energético", brand: "Energético", unit: "UN", cost: 6.0, price: 12.0 },
  { name: "Energético Lata 473ml", category: "Energético", brand: "Energético", unit: "UN", cost: 8.5, price: 16.0 },
  { name: "Gelo Pacote 2kg", category: "Gelo", brand: "Gelo", unit: "UN", cost: 3.0, price: 7.0 },
  { name: "Gelo Pacote 5kg", category: "Gelo", brand: "Gelo", unit: "UN", cost: 6.0, price: 13.0 },
] as const;

const FIRST_NAMES = ["Ana", "Bruno", "Carla", "Diego", "Elaine", "Fábio", "Gabriela", "Hugo", "Ivete", "João"];
const LAST_NAMES = ["Silva", "Souza", "Oliveira", "Santos", "Pereira", "Costa", "Almeida", "Ribeiro"];

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

function personName(seed: number) {
  return `${pick(FIRST_NAMES, seed)} ${pick(LAST_NAMES, seed + 3)}`;
}

async function seedPlans() {
  const [starter, professional, premium] = await Promise.all([
    prisma.plan.create({
      data: {
        name: "Starter",
        slug: "starter",
        description: "Ideal para quem está começando",
        priceMonthly: 79.9,
        priceYearly: 799,
        maxUsers: 2,
        maxProducts: 500,
        maxCustomers: 500,
        maxSuppliers: 50,
        maxStorageMb: 1024,
        features: [],
        sortOrder: 1,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Professional",
        slug: "professional",
        description: "Para distribuidoras em crescimento",
        priceMonthly: 199.9,
        priceYearly: 1999,
        maxUsers: 10,
        maxProducts: 5000,
        maxCustomers: 10000,
        maxSuppliers: 200,
        maxStorageMb: 10240,
        features: ["advanced_reports", "delivery_management", "barcode_scanner"],
        sortOrder: 2,
      },
    }),
    prisma.plan.create({
      data: {
        name: "Premium",
        slug: "premium",
        description: "Recursos ilimitados para operações de grande porte",
        priceMonthly: 399.9,
        priceYearly: 3999,
        maxUsers: -1,
        maxProducts: -1,
        maxCustomers: -1,
        maxSuppliers: -1,
        maxStorageMb: 102400,
        features: [
          "advanced_reports",
          "delivery_management",
          "barcode_scanner",
          "multiple_cash_registers",
          "financial_reports",
          "inventory",
          "offline_mode",
          "api_access",
        ],
        sortOrder: 3,
      },
    }),
  ]);
  return { starter, professional, premium };
}

interface CompanySeedSpec {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  city: string;
  state: string;
  status: "TRIAL" | "ACTIVE" | "PAST_DUE";
  planId: string;
  planSlug: string;
}

async function seedCompany(spec: CompanySeedSpec, companySeed: number) {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + (spec.status === "TRIAL" ? 3 : -1) * 24 * 60 * 60 * 1000);

  const company = await prisma.company.create({
    data: {
      razaoSocial: spec.razaoSocial,
      nomeFantasia: spec.nomeFantasia,
      cnpj: spec.cnpj,
      email: `contato@${spec.nomeFantasia.toLowerCase().replace(/\s+/g, "")}.com.br`,
      phone: "(11) 3333-4444",
      whatsapp: "(11) 99999-0000",
      zipCode: "01000-000",
      address: "Rua das Distribuidoras",
      addressNumber: `${100 + companySeed}`,
      neighborhood: "Centro",
      city: spec.city,
      state: spec.state,
      status: spec.status,
      trialStartsAt: now,
      trialEndsAt,
      settings: { create: {} },
      subscription: {
        create: {
          planId: spec.planId,
          status: spec.status === "TRIAL" ? "TRIALING" : spec.status === "PAST_DUE" ? "PAST_DUE" : "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          paymentProvider: "manual",
        },
      },
    },
  });

  const roles: { role: CompanyRole; name: string }[] = [
    { role: "ADMINISTRADOR", name: personName(companySeed) },
    { role: "GERENTE", name: personName(companySeed + 1) },
    { role: "VENDEDOR", name: personName(companySeed + 2) },
    { role: "ESTOQUISTA", name: personName(companySeed + 3) },
    { role: "FINANCEIRO", name: personName(companySeed + 4) },
    { role: "MOTORISTA", name: personName(companySeed + 5) },
  ];

  const passwordHash = await hash(DEMO_PASSWORD);
  const users: Record<string, { id: string; name: string }> = {};

  for (const r of roles) {
    const email = `${r.role.toLowerCase()}@${spec.planSlug}${companySeed}.com`;
    const user = await prisma.user.create({
      data: {
        userType: "COMPANY_USER",
        companyId: company.id,
        name: r.name,
        email,
        passwordHash,
        role: r.role,
      },
    });
    users[r.role] = { id: user.id, name: user.name };
  }

  // Categories & brands derived from catalog
  const categoryNames = [...new Set(PRODUCT_CATALOG.map((p) => p.category))];
  const brandNames = [...new Set(PRODUCT_CATALOG.map((p) => p.brand))];

  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const c = await prisma.category.create({ data: { companyId: company.id, name } });
    categories[name] = c.id;
  }
  const brands: Record<string, string> = {};
  for (const name of brandNames) {
    const b = await prisma.brand.create({ data: { companyId: company.id, name } });
    brands[name] = b.id;
  }

  const products = [];
  for (let i = 0; i < PRODUCT_CATALOG.length; i++) {
    const p = PRODUCT_CATALOG[i];
    const priceVariance = 1 + ((companySeed % 5) - 2) * 0.02;
    const initialStock = 40 + ((i * 7 + companySeed) % 60);
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        name: p.name,
        sku: `SKU-${companySeed}-${String(i + 1).padStart(3, "0")}`,
        barcode: `78900000${companySeed}${String(i).padStart(4, "0")}`,
        categoryId: categories[p.category],
        brandId: brands[p.brand],
        unit: p.unit,
        cost: p.cost,
        averageCost: p.cost,
        price: Math.round(p.price * priceVariance * 100) / 100,
        stock: initialStock,
        minStock: 10,
        maxStock: 200,
        active: true,
      },
    });
    products.push(product);

    await prisma.stockMovement.create({
      data: {
        companyId: company.id,
        productId: product.id,
        type: StockMovementType.ENTRADA,
        quantity: initialStock,
        balanceAfter: initialStock,
        reason: "Estoque inicial (carga de demonstração)",
      },
    });
  }

  const suppliers = [];
  const supplierNames = ["Distribuidora Central", "AmBev Regional", "Coca Sul Distribuição", "Bebidas Express", "Atacado Boa Sorte"];
  for (let i = 0; i < supplierNames.length; i++) {
    const supplier = await prisma.supplier.create({
      data: {
        companyId: company.id,
        name: supplierNames[i],
        document: `1${companySeed}${i}.000.000/0001-0${i}`,
        phone: "(11) 4000-000" + i,
        email: `contato@fornecedor${i}.com`,
        address: "Av. Industrial, " + (200 + i),
      },
    });
    suppliers.push(supplier);
  }

  const customers = [];
  for (let i = 0; i < 10; i++) {
    const customer = await prisma.customer.create({
      data: {
        companyId: company.id,
        name: personName(companySeed + i + 10) + (i % 3 === 0 ? " Bar & Petiscos" : ""),
        document: `${companySeed}${i}1.222.333-4${i}`,
        phone: `(11) 98888-${String(1000 + i)}`,
        whatsapp: `(11) 98888-${String(1000 + i)}`,
        address: `Rua ${i + 1}, ${100 + i}`,
        creditLimit: i % 2 === 0 ? 500 : 0,
      },
    });
    customers.push(customer);
  }

  // Purchases (10)
  for (let i = 0; i < 10; i++) {
    const supplier = suppliers[i % suppliers.length];
    const items = products.slice((i * 2) % products.length, ((i * 2) % products.length) + 3);
    const usedItems = items.length ? items : [products[0]];
    let total = 0;
    const purchase = await prisma.purchase.create({
      data: {
        companyId: company.id,
        supplierId: supplier.id,
        userId: users.ESTOQUISTA.id,
        status: "RECEIVED",
        paymentTerm: i % 3 === 0 ? PaymentTerm.CREDIT : PaymentTerm.CASH,
        totalAmount: 0,
      },
    });

    for (const product of usedItems) {
      const qty = 10 + (i % 5) * 3;
      const unitCost = Number(product.cost);
      const lineTotal = qty * unitCost;
      total += lineTotal;
      await prisma.purchaseItem.create({
        data: { purchaseId: purchase.id, productId: product.id, quantity: qty, unitCost, totalCost: lineTotal },
      });
      const newStock = Number(product.stock) + qty;
      await prisma.product.update({ where: { id: product.id }, data: { stock: newStock } });
      await prisma.stockMovement.create({
        data: {
          companyId: company.id,
          productId: product.id,
          type: StockMovementType.COMPRA,
          quantity: qty,
          balanceAfter: newStock,
          purchaseId: purchase.id,
        },
      });
      product.stock = newStock as unknown as typeof product.stock;
    }

    await prisma.purchase.update({ where: { id: purchase.id }, data: { totalAmount: total } });

    if (purchase.paymentTerm === PaymentTerm.CREDIT) {
      await prisma.accountPayable.create({
        data: {
          companyId: company.id,
          purchaseId: purchase.id,
          description: `Compra #${purchase.id.slice(-6)} - ${supplier.name}`,
          amount: total,
          dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
          status: "OPEN",
        },
      });
    }
  }

  // Cash register (open one)
  const cashRegister = await prisma.cashRegister.create({
    data: {
      companyId: company.id,
      userId: users.FINANCEIRO.id,
      status: "OPEN",
      openingBalance: 200,
      expectedBalance: 200,
    },
  });
  await prisma.cashMovement.create({
    data: { cashRegisterId: cashRegister.id, type: "ABERTURA", amount: 200, description: "Abertura de caixa" },
  });

  // Sales (20)
  for (let i = 0; i < 20; i++) {
    const isFiado = i % 4 === 0;
    const customer = isFiado || i % 2 === 0 ? customers[i % customers.length] : null;
    const items = [products[i % products.length], products[(i + 3) % products.length]];
    let subtotal = 0;
    const sale = await prisma.sale.create({
      data: {
        companyId: company.id,
        customerId: customer?.id,
        userId: users.VENDEDOR.id,
        paymentTerm: isFiado ? PaymentTerm.CREDIT : PaymentTerm.CASH,
        paymentMethod: isFiado ? "fiado" : i % 3 === 0 ? "pix" : "cash",
        subtotal: 0,
        totalAmount: 0,
      },
    });

    for (const product of items) {
      const qty = 1 + (i % 3);
      const unitPrice = Number(product.price);
      const lineTotal = qty * unitPrice;
      subtotal += lineTotal;
      await prisma.saleItem.create({
        data: { saleId: sale.id, productId: product.id, quantity: qty, unitPrice, totalPrice: lineTotal },
      });
      const current = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
      const newStock = Number(current.stock) - qty;
      await prisma.product.update({ where: { id: product.id }, data: { stock: newStock } });
      await prisma.stockMovement.create({
        data: {
          companyId: company.id,
          productId: product.id,
          type: StockMovementType.VENDA,
          quantity: -qty,
          balanceAfter: newStock,
          saleId: sale.id,
        },
      });
    }

    await prisma.sale.update({ where: { id: sale.id }, data: { subtotal, totalAmount: subtotal } });

    if (isFiado && customer) {
      await prisma.accountReceivable.create({
        data: {
          companyId: company.id,
          customerId: customer.id,
          saleId: sale.id,
          description: `Venda #${sale.id.slice(-6)}`,
          amount: subtotal,
          dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: "OPEN",
        },
      });
    } else {
      await prisma.cashMovement.create({
        data: { cashRegisterId: cashRegister.id, saleId: sale.id, type: "VENDA", amount: subtotal, description: "Venda no caixa" },
      });
      await prisma.cashRegister.update({
        where: { id: cashRegister.id },
        data: { expectedBalance: { increment: subtotal } },
      });
    }
  }

  // Drivers & vehicles & deliveries
  const driver = await prisma.driver.create({
    data: { companyId: company.id, userId: users.MOTORISTA.id, name: users.MOTORISTA.name, phone: "(11) 97777-0000" },
  });
  const vehicle = await prisma.vehicle.create({
    data: { companyId: company.id, driverId: driver.id, plate: `ABC-${1000 + companySeed}`, model: "Fiorino" },
  });

  const recentSales = await prisma.sale.findMany({ where: { companyId: company.id }, take: 5, include: { items: true } });
  for (const sale of recentSales) {
    const delivery = await prisma.delivery.create({
      data: {
        companyId: company.id,
        saleId: sale.id,
        customerId: sale.customerId,
        driverId: driver.id,
        status: "PENDING",
        address: "Endereço de entrega do cliente",
      },
    });
    for (const item of sale.items) {
      await prisma.deliveryItem.create({
        data: { deliveryId: delivery.id, productId: item.productId, quantity: item.quantity },
      });
    }
  }
  void vehicle;

  await prisma.notification.create({
    data: {
      companyId: company.id,
      title: "Bem-vindo!",
      message: `Ambiente de demonstração da ${spec.nomeFantasia} pronto para uso.`,
      type: "success",
    },
  });

  return company;
}

async function main() {
  console.log("Limpando banco...");
  const tables = [
    "delivery_items", "deliveries", "vehicles", "drivers",
    "notifications", "audit_logs",
    "financial_transactions", "accounts_receivable", "accounts_payable",
    "cash_movements", "cash_registers",
    "inventory_items", "inventories", "stock_movements",
    "sale_items", "sales", "purchase_items", "purchases",
    "customers", "suppliers", "products", "brands", "categories",
    "invoices", "payments", "subscriptions",
    "users", "company_settings", "companies", "plans",
  ];
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE`);
  }

  console.log("Criando planos...");
  const { starter, professional, premium } = await seedPlans();

  console.log("Criando super admin...");
  await prisma.user.create({
    data: {
      userType: "SUPER_ADMIN",
      name: "Super Admin",
      email: "italoplaylist@gmail.com",
      passwordHash: await hash(DEMO_PASSWORD),
    },
  });

  console.log("Criando empresas de demonstração...");
  await seedCompany(
    {
      razaoSocial: "Distribuidora Silva Bebidas Ltda",
      nomeFantasia: "Distribuidora Silva",
      cnpj: "11.111.111/0001-11",
      city: "São Paulo",
      state: "SP",
      status: "ACTIVE",
      planId: professional.id,
      planSlug: "prof",
    },
    1,
  );

  await seedCompany(
    {
      razaoSocial: "Atacado Bebidas Rio Ltda",
      nomeFantasia: "Atacado Rio",
      cnpj: "22.222.222/0001-22",
      city: "Rio de Janeiro",
      state: "RJ",
      status: "TRIAL",
      planId: starter.id,
      planSlug: "start",
    },
    2,
  );

  await seedCompany(
    {
      razaoSocial: "Premium Distribuidora de Bebidas S.A.",
      nomeFantasia: "Premium Distribuidora",
      cnpj: "33.333.333/0001-33",
      city: "Curitiba",
      state: "PR",
      status: "ACTIVE",
      planId: premium.id,
      planSlug: "premium",
    },
    3,
  );

  console.log("Seed concluído!");
  console.log("Login super admin: italoplaylist@gmail.com / " + DEMO_PASSWORD);
  console.log("Login empresas: administrador@prof1.com / start2.com / premium3.com etc. / " + DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

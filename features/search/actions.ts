"use server";

import { requireRead } from "@/lib/permissions/guard";
import { prisma } from "@/lib/database/prisma";
import { formatCurrency } from "@/lib/utils";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  group: "Produtos" | "Clientes" | "Fornecedores" | "Vendas";
}

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const tenant = await requireRead();

  const [products, customers, suppliers, sales] = await Promise.all([
    prisma.product.findMany({
      where: { companyId: tenant.companyId, active: true, OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { barcode: { contains: q } }] },
      take: 5,
    }),
    prisma.customer.findMany({
      where: { companyId: tenant.companyId, active: true, OR: [{ name: { contains: q, mode: "insensitive" } }, { document: { contains: q } }] },
      take: 5,
    }),
    prisma.supplier.findMany({
      where: { companyId: tenant.companyId, active: true, name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
    prisma.sale.findMany({
      where: {
        companyId: tenant.companyId,
        OR: [{ id: q }, { customer: { name: { contains: q, mode: "insensitive" } } }],
      },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return [
    ...products.map((p) => ({ id: p.id, title: p.name, subtitle: `SKU ${p.sku ?? "-"}`, href: `/dashboard/products/${p.id}`, group: "Produtos" as const })),
    ...customers.map((c) => ({ id: c.id, title: c.name, subtitle: c.phone ?? undefined, href: `/dashboard/customers/${c.id}`, group: "Clientes" as const })),
    ...suppliers.map((s) => ({ id: s.id, title: s.name, subtitle: s.phone ?? undefined, href: `/dashboard/suppliers/${s.id}`, group: "Fornecedores" as const })),
    ...sales.map((s) => ({
      id: s.id,
      title: `Venda de ${formatCurrency(s.totalAmount.toString())}`,
      subtitle: `${s.customer?.name ?? "Cliente avulso"} · ${new Date(s.createdAt).toLocaleDateString("pt-BR")}`,
      href: `/dashboard/sales/${s.id}`,
      group: "Vendas" as const,
    })),
  ];
}

import "server-only";
import { prisma } from "@/lib/database/prisma";
import { NotFoundError } from "@/lib/tenant/tenant-context";

export async function getAdminDashboardMetrics() {
  const [
    totalCompanies,
    activeCompanies,
    trialCompanies,
    suspendedCompanies,
    canceledCompanies,
    totalUsers,
    activeUsers,
    activeSubscriptions,
    trialingSubscriptions,
    canceledSubscriptions,
    pastDueSubscriptions,
    totalSales,
    totalProducts,
    activeSubsWithPlan,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.company.count({ where: { status: "TRIAL" } }),
    prisma.company.count({ where: { status: "SUSPENDED" } }),
    prisma.company.count({ where: { status: "CANCELED" } }),
    prisma.user.count({ where: { userType: "COMPANY_USER" } }),
    prisma.user.count({ where: { userType: "COMPANY_USER", active: true } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "TRIALING" } }),
    prisma.subscription.count({ where: { status: "CANCELED" } }),
    prisma.subscription.count({ where: { status: "PAST_DUE" } }),
    prisma.sale.count({ where: { status: "COMPLETED" } }),
    prisma.product.count(),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, include: { plan: true } }),
  ]);

  const mrr = activeSubsWithPlan.reduce((sum, s) => {
    const monthly = s.billingCycle === "yearly" ? Number(s.plan.priceYearly) / 12 : Number(s.plan.priceMonthly);
    return sum + monthly;
  }, 0);

  return {
    totalCompanies,
    activeCompanies,
    trialCompanies,
    suspendedCompanies,
    canceledCompanies,
    totalUsers,
    activeUsers,
    activeSubscriptions,
    trialingSubscriptions,
    canceledSubscriptions,
    pastDueSubscriptions,
    totalSales,
    totalProducts,
    mrr,
    arr: mrr * 12,
    arpu: activeSubscriptions > 0 ? mrr / activeSubscriptions : 0,
  };
}

export async function listCompaniesAdmin(search?: string) {
  return prisma.company.findMany({
    where: search
      ? { OR: [{ nomeFantasia: { contains: search, mode: "insensitive" } }, { razaoSocial: { contains: search, mode: "insensitive" } }, { cnpj: { contains: search } }] }
      : undefined,
    include: { subscription: { include: { plan: true } }, _count: { select: { users: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCompanyAdminDetail(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscription: { include: { plan: true } },
      users: { orderBy: { createdAt: "asc" } },
      _count: { select: { products: true, customers: true, sales: true, suppliers: true } },
    },
  });
  if (!company) throw new NotFoundError("Empresa não encontrada");
  return company;
}

export async function listSubscriptionsAdmin() {
  return prisma.subscription.findMany({
    include: { plan: true, company: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlatformAuditLogs() {
  return prisma.auditLog.findMany({
    include: { company: true, user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

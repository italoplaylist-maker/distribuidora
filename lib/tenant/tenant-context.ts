import "server-only";
import { cache } from "react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";

export { UnauthorizedError, ForbiddenError, NotFoundError, canWrite, canRead } from "@/lib/tenant/errors";
import { UnauthorizedError, ForbiddenError } from "@/lib/tenant/errors";

/**
 * Resolves the authenticated session once per request (React cache dedupes
 * repeated calls within the same server render/action).
 */
export const getSession = cache(async () => {
  return auth();
});

/**
 * Returns the current authenticated COMPANY_USER's tenant context.
 * Never trust a companyId passed from the client — this is the only
 * source of truth for "which company am I operating on".
 */
export const getCurrentTenant = cache(async () => {
  const session = await getSession();
  if (!session?.user) throw new UnauthorizedError();
  if (session.user.userType !== "COMPANY_USER" || !session.user.companyId) {
    throw new ForbiddenError("Usuário não pertence a uma empresa");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    include: { subscription: { include: { plan: true } }, settings: true },
  });

  if (!company || company.deletedAt) throw new ForbiddenError("Empresa não encontrada");

  return {
    userId: session.user.id,
    userName: session.user.name ?? "",
    role: session.user.role,
    companyId: company.id,
    company,
  };
});

export const requireSuperAdmin = cache(async () => {
  const session = await getSession();
  if (!session?.user) throw new UnauthorizedError();
  if (session.user.userType !== "SUPER_ADMIN") throw new ForbiddenError();
  return session.user;
});

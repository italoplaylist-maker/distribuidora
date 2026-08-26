import "server-only";
import { cache } from "react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/prisma";
import { getImpersonation } from "@/lib/auth/impersonation";

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

  let userId: string;
  let companyId: string;
  let impersonatedBy: { adminId: string; adminName: string } | null = null;

  if (session.user.userType === "SUPER_ADMIN") {
    const impersonation = await getImpersonation();
    if (!impersonation || impersonation.adminId !== session.user.id) {
      throw new ForbiddenError("Usuário não pertence a uma empresa");
    }
    userId = impersonation.userId;
    companyId = impersonation.companyId;
    impersonatedBy = { adminId: impersonation.adminId, adminName: impersonation.adminName };
  } else if (session.user.userType === "COMPANY_USER" && session.user.companyId) {
    userId = session.user.id;
    companyId = session.user.companyId;
  } else {
    throw new ForbiddenError("Usuário não pertence a uma empresa");
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscription: { include: { plan: true } }, settings: true },
  });

  if (!company || company.deletedAt) throw new ForbiddenError("Empresa não encontrada");

  // When impersonating, re-resolve the acting user fresh on every call — if they
  // were deactivated mid-session the impersonation must stop working immediately.
  const actingUser = impersonatedBy
    ? await prisma.user.findFirst({ where: { id: userId, companyId, userType: "COMPANY_USER", active: true } })
    : { id: userId, name: session.user.name ?? "", role: session.user.role };

  if (!actingUser) throw new ForbiddenError("Usuário não encontrado nesta empresa");

  return {
    userId: actingUser.id,
    userName: actingUser.name ?? "",
    role: actingUser.role,
    companyId: company.id,
    company,
    impersonatedBy,
  };
});

export const requireSuperAdmin = cache(async () => {
  const session = await getSession();
  if (!session?.user) throw new UnauthorizedError();
  if (session.user.userType !== "SUPER_ADMIN") throw new ForbiddenError();
  return session.user;
});

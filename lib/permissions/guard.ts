import "server-only";
import { ForbiddenError, getCurrentTenant, canRead, canWrite } from "@/lib/tenant/tenant-context";
import { roleHasPermission, type Permission } from "@/lib/permissions/permissions";

/**
 * Full multi-tenant + RBAC guard for a mutating server action.
 * Resolves the tenant from the session (never from client input),
 * checks the company's billing status allows writes, and checks the
 * user's role carries the required permission.
 */
export async function requirePermission(permission: Permission) {
  const tenant = await getCurrentTenant();

  if (!canWrite(tenant.company)) {
    throw new ForbiddenError(
      tenant.company.status === "SUSPENDED"
        ? "Empresa suspensa. Regularize sua assinatura para continuar."
        : "Seu período de teste terminou. Fale com o suporte para continuar.",
    );
  }

  if (!roleHasPermission(tenant.role, permission)) {
    throw new ForbiddenError("Você não tem permissão para realizar esta ação");
  }

  return tenant;
}

/** Read-only guard: still checks the company isn't blocked, no permission check beyond auth. */
export async function requireRead() {
  const tenant = await getCurrentTenant();
  if (!canRead(tenant.company)) {
    throw new ForbiddenError("Empresa suspensa ou cancelada");
  }
  return tenant;
}

import { CompanyRole } from "@prisma/client";

export const PERMISSIONS = {
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  SALES_VIEW: "sales.view",
  SALES_CREATE: "sales.create",
  SALES_CANCEL: "sales.cancel",
  SALES_DISCOUNT: "sales.discount",

  STOCK_VIEW: "stock.view",
  STOCK_ADJUST: "stock.adjust",
  STOCK_INVENTORY: "stock.inventory",

  PURCHASES_VIEW: "purchases.view",
  PURCHASES_CREATE: "purchases.create",
  PURCHASES_CANCEL: "purchases.cancel",

  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_MANAGE: "customers.manage",

  SUPPLIERS_VIEW: "suppliers.view",
  SUPPLIERS_MANAGE: "suppliers.manage",

  FINANCE_VIEW: "finance.view",
  FINANCE_PAY: "finance.pay",
  FINANCE_RECEIVE: "finance.receive",
  CASH_MANAGE: "cash.manage",

  DELIVERIES_VIEW: "deliveries.view",
  DELIVERIES_MANAGE: "deliveries.manage",

  REPORTS_VIEW: "reports.view",
  USERS_MANAGE: "users.manage",
  COMPANY_SETTINGS: "company.settings",
  AUDIT_VIEW: "audit.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<CompanyRole, Permission[]> = {
  ADMINISTRADOR: ALL_PERMISSIONS,
  GERENTE: ALL_PERMISSIONS.filter((p) => p !== PERMISSIONS.USERS_MANAGE && p !== PERMISSIONS.COMPANY_SETTINGS),
  VENDEDOR: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_CREATE,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.CUSTOMERS_MANAGE,
    PERMISSIONS.DELIVERIES_VIEW,
  ],
  ESTOQUISTA: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.STOCK_VIEW,
    PERMISSIONS.STOCK_ADJUST,
    PERMISSIONS.STOCK_INVENTORY,
    PERMISSIONS.PURCHASES_VIEW,
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_MANAGE,
  ],
  FINANCEIRO: [
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_PAY,
    PERMISSIONS.FINANCE_RECEIVE,
    PERMISSIONS.CASH_MANAGE,
    PERMISSIONS.CUSTOMERS_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  MOTORISTA: [PERMISSIONS.DELIVERIES_VIEW, PERMISSIONS.DELIVERIES_MANAGE],
};

export function roleHasPermission(role: CompanyRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

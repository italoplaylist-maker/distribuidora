import {
  LayoutDashboard,
  Receipt,
  Boxes,
  ShoppingCart,
  Users,
  Truck as TruckIcon,
  Wallet,
  BarChart3,
  Settings,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, type Permission } from "@/lib/permissions/permissions";

export const ICONS = {
  dashboard: LayoutDashboard,
  sales: Receipt,
  purchases: ShoppingCart,
  stock: Boxes,
  customers: Users,
  suppliers: Building2,
  finance: Wallet,
  deliveries: TruckIcon,
  reports: BarChart3,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;

/** Plain, serializable nav item — safe to pass from Server to Client Components. */
export interface NavItem {
  href: string;
  label: string;
  icon: IconKey;
  permission?: Permission;
}

export const SIDEBAR_MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/sales", label: "Vendas", icon: "sales", permission: PERMISSIONS.SALES_VIEW },
  { href: "/dashboard/products", label: "Estoque", icon: "stock", permission: PERMISSIONS.STOCK_VIEW },
  { href: "/dashboard/purchases", label: "Compras", icon: "purchases", permission: PERMISSIONS.PURCHASES_VIEW },
  { href: "/dashboard/customers", label: "Clientes", icon: "customers", permission: PERMISSIONS.CUSTOMERS_VIEW },
  { href: "/dashboard/suppliers", label: "Fornecedores", icon: "suppliers", permission: PERMISSIONS.SUPPLIERS_VIEW },
  { href: "/dashboard/finance", label: "Financeiro", icon: "finance", permission: PERMISSIONS.FINANCE_VIEW },
  { href: "/dashboard/deliveries", label: "Entregas", icon: "deliveries", permission: PERMISSIONS.DELIVERIES_VIEW },
  { href: "/dashboard/reports", label: "Relatórios", icon: "reports", permission: PERMISSIONS.REPORTS_VIEW },
];

export const SIDEBAR_SETTINGS_NAV: NavItem[] = [{ href: "/dashboard/settings", label: "Configurações", icon: "settings" }];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: "dashboard" },
  { href: "/dashboard/sales", label: "Vendas", icon: "sales", permission: PERMISSIONS.SALES_VIEW },
  { href: "/dashboard/products", label: "Estoque", icon: "stock", permission: PERMISSIONS.STOCK_VIEW },
  { href: "/dashboard/finance", label: "Financeiro", icon: "finance", permission: PERMISSIONS.FINANCE_VIEW },
];

export const MORE_NAV: NavItem[] = [
  { href: "/dashboard/purchases", label: "Compras", icon: "purchases", permission: PERMISSIONS.PURCHASES_VIEW },
  { href: "/dashboard/customers", label: "Clientes", icon: "customers", permission: PERMISSIONS.CUSTOMERS_VIEW },
  { href: "/dashboard/suppliers", label: "Fornecedores", icon: "suppliers", permission: PERMISSIONS.SUPPLIERS_VIEW },
  { href: "/dashboard/deliveries", label: "Entregas", icon: "deliveries", permission: PERMISSIONS.DELIVERIES_VIEW },
  { href: "/dashboard/reports", label: "Relatórios", icon: "reports", permission: PERMISSIONS.REPORTS_VIEW },
  { href: "/dashboard/settings", label: "Configurações", icon: "settings" },
];

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Building2, Package, CreditCard, ScrollText, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/companies", label: "Empresas", icon: Building2 },
  { href: "/admin/plans", label: "Planos", icon: Package },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/audit", label: "Auditoria", icon: ScrollText },
];

export function isAdminNavActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/70 bg-card lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-border/70 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-semibold leading-tight">Super Admin</p>
          <p className="truncate text-[11.5px] text-muted-foreground">Plataforma SaaS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">Plataforma</p>
        {ADMIN_NAV.map((item) => {
          const active = isAdminNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {active && <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-primary" />}
              <item.icon className="size-[18px] shrink-0" strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/70 p-3">
        <p className="truncate px-3 py-1 text-[12.5px] text-muted-foreground">{adminName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-[18px]" /> Sair
        </button>
      </div>
    </aside>
  );
}

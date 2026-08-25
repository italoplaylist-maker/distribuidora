"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Building2, Package, CreditCard, ScrollText, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/companies", label: "Empresas", icon: Building2 },
  { href: "/admin/plans", label: "Planos", icon: Package },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
  { href: "/admin/audit", label: "Auditoria", icon: ScrollText },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-zinc-800 bg-[#111315] text-zinc-100">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/20">
          <ShieldCheck className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Super Admin</p>
          <p className="text-[11px] text-zinc-500">Plataforma SaaS</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary/15 text-primary" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-3">
        <p className="truncate px-3 py-1 text-xs text-zinc-500">{adminName}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <LogOut className="size-4.5" /> Sair
        </button>
      </div>
    </aside>
  );
}

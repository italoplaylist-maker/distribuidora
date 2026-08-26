"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronsLeft, ChevronsRight, ChevronDown, Settings, LogOut, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICONS, type NavItem } from "@/components/layout/nav-config";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

function NavLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-primary" />}
      <Icon className="size-[18px] shrink-0" strokeWidth={2} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function Sidebar({
  mainItems,
  settingsItems,
  companyName,
  planName,
}: {
  mainItems: NavItem[];
  settingsItems: NavItem[];
  companyName: string;
  planName?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname.startsWith(href));

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/70 bg-card transition-[width] duration-200 lg:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex h-16 items-center gap-2.5 border-b border-border/70 px-4 text-left transition-colors hover:bg-muted/60",
              collapsed && "justify-center px-0",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-[15px] font-bold text-primary-foreground">
              {companyName.charAt(0).toUpperCase()}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold leading-tight">{companyName}</span>
                  {planName && <span className="block truncate text-[11.5px] text-muted-foreground">Plano {planName}</span>}
                </span>
                <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>{companyName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings/billing">
              <CreditCard className="size-4" /> Plano e assinatura
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings/company">
              <Settings className="size-4" /> Configurações da empresa
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })} className="text-destructive">
            <LogOut className="size-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {!collapsed && <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">Principal</p>}
        {mainItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-border/70 p-3">
        {settingsItems.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} active={isActive(item.href)} />
        ))}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? <ChevronsRight className="size-[18px]" /> : <ChevronsLeft className="size-[18px]" />}
          {!collapsed && "Recolher"}
        </button>
      </div>
    </aside>
  );
}

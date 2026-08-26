"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, ShieldCheck } from "lucide-react";
import { ADMIN_NAV, isAdminNavActive } from "@/components/layout/admin-sidebar";

export function AdminMobileHeader() {
  const pathname = usePathname();
  const current = ADMIN_NAV.find((item) => isAdminNavActive(pathname, item.href));

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-card/90 px-4 backdrop-blur-lg lg:hidden">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-[18px] text-primary" />
        <span className="text-[15px] font-semibold">{current?.label ?? "Super Admin"}</span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Sair"
      >
        <LogOut className="size-[18px]" />
      </button>
    </header>
  );
}

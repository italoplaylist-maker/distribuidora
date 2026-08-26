"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, isAdminNavActive } from "@/components/layout/admin-sidebar";

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-border/70 bg-card/90 backdrop-blur-lg lg:hidden">
      {ADMIN_NAV.map((item) => {
        const active = isAdminNavActive(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} className="relative flex flex-1 flex-col items-center gap-1 py-2.5">
            {active && (
              <motion.span
                layoutId="admin-bottom-nav-active"
                className="absolute top-1 h-0.5 w-8 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <item.icon className={cn("size-[21px] transition-colors", active ? "text-primary" : "text-muted-foreground")} strokeWidth={active ? 2.25 : 2} />
            <span className={cn("text-[10.5px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

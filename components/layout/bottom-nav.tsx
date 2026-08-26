"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICONS, type NavItem } from "@/components/layout/nav-config";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function BottomNav({ items, moreItems }: { items: NavItem[]; moreItems: NavItem[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-border/70 bg-card/90 backdrop-blur-lg lg:hidden">
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = ICONS[item.icon];
          return (
            <Link key={item.href} href={item.href} className="relative flex flex-1 flex-col items-center gap-1 py-2.5">
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute top-1 h-0.5 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn("size-[21px] transition-colors", active ? "text-primary" : "text-muted-foreground")} strokeWidth={active ? 2.25 : 2} />
              <span className={cn("text-[10.5px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Link>
          );
        })}
        {moreItems.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium text-muted-foreground"
          >
            <Menu className="size-[21px]" />
            Mais
          </button>
        )}
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="mt-2 grid grid-cols-3 gap-3 pb-2">
            {moreItems.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border/70 p-4 text-center text-[12.5px] font-medium transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

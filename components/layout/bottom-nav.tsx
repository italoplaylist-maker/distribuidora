"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICONS, type NavItem } from "@/components/layout/nav-config";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function BottomNav({ items, moreItems }: { items: NavItem[]; moreItems: NavItem[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur lg:hidden">
        {items.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
        {moreItems.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
          >
            <Menu className="size-5" />
            Mais
          </button>
        )}
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Mais opções</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-3 gap-3 pb-4">
            {moreItems.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center text-xs font-medium hover:bg-muted"
                >
                  <Icon className="size-5 text-primary" />
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

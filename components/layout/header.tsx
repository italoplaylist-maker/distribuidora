"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, User, ChevronLeft, HelpCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/features/search/global-search";
import { NotificationsBell } from "@/features/notifications/notifications-bell";
import { SignOutMenuItem } from "@/features/auth/sign-out-button";
import { SIDEBAR_MAIN_NAV, SIDEBAR_SETTINGS_NAV } from "@/components/layout/nav-config";

const TOP_LEVEL_ROUTES = new Set([...SIDEBAR_MAIN_NAV, ...SIDEBAR_SETTINGS_NAV].map((i) => i.href));

export function Header({ userName, roleLabel }: { userName: string; roleLabel: string }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isSubPage = !TOP_LEVEL_ROUTES.has(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2.5 border-b border-border/70 bg-background/85 px-4 backdrop-blur-lg sm:gap-3">
      {isSubPage && (
        <button
          onClick={() => router.back()}
          className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-5" />
        </button>
      )}

      <div className="hidden flex-1 lg:block">
        <GlobalSearch />
      </div>
      <div className="flex flex-1 justify-end lg:hidden">
        <GlobalSearch variant="icon" />
      </div>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="hidden size-10 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card hover:bg-muted sm:flex"
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      <a
        href="mailto:suporte@distribuidora.com"
        className="hidden size-10 shrink-0 items-center justify-center rounded-md border border-border/70 bg-card hover:bg-muted lg:flex"
        aria-label="Ajuda"
      >
        <HelpCircle className="size-4" />
      </a>
      <NotificationsBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20">
            <User className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <p className="font-medium">{userName}</p>
            <p className="text-xs font-normal text-muted-foreground">{roleLabel}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2.5 text-left text-[14px] hover:bg-muted sm:hidden"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
          <SignOutMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, User } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/features/search/global-search";
import { NotificationsBell } from "@/features/notifications/notifications-bell";
import { SignOutMenuItem } from "@/features/auth/sign-out-button";

export function Header({ userName, roleLabel }: { userName: string; roleLabel: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <div className="flex-1">
        <GlobalSearch />
      </div>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex size-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted"
      >
        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>
      <NotificationsBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20">
            <User className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <p className="font-medium">{userName}</p>
            <p className="text-xs font-normal text-muted-foreground">{roleLabel}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <SignOutMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

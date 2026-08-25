"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function SignOutMenuItem() {
  return (
    <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })} className="text-destructive">
      <LogOut className="size-4" /> Sair
    </DropdownMenuItem>
  );
}

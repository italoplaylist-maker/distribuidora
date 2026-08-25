"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProductsSearch({ defaultValue, lowStockActive }: { defaultValue?: string; lowStockActive?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? "");
  const [, startTransition] = useTransition();

  function updateParams(next: { q?: string; filter?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    if (next.filter !== undefined) {
      if (next.filter) params.set("filter", next.filter);
      else params.delete("filter");
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            updateParams({ q: e.target.value });
          }}
          placeholder="Buscar por nome, SKU ou código de barras"
          className="pl-9"
        />
      </div>
      <Button
        type="button"
        variant={lowStockActive ? "default" : "outline"}
        size="sm"
        className={cn("h-11")}
        onClick={() => updateParams({ filter: lowStockActive ? "" : "low-stock" })}
      >
        Estoque baixo
      </Button>
    </div>
  );
}

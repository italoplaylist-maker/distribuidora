"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "Todos" },
  { value: "low-stock", label: "Baixo" },
  { value: "zero-stock", label: "Zerado" },
  { value: "recent", label: "Recentes" },
];

export function ProductsSearch({ defaultValue, activeFilter }: { defaultValue?: string; activeFilter?: string }) {
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
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            updateParams({ q: e.target.value });
          }}
          placeholder="Buscar por nome, SKU ou código de barras"
          className="pl-10"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => updateParams({ filter: f.value })}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              (activeFilter ?? "") === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Users, Building2, Loader2, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { globalSearch, type SearchResultItem } from "@/features/search/actions";
import { cn } from "@/lib/utils";

const GROUP_ICON: Record<string, typeof Package> = {
  Produtos: Package,
  Clientes: Users,
  Fornecedores: Building2,
  Vendas: Receipt,
};

export function GlobalSearch({ variant = "input" }: { variant?: "input" | "icon" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await globalSearch(query);
        setResults(r);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const grouped = results.reduce<Record<string, SearchResultItem[]>>((acc, r) => {
    acc[r.group] = acc[r.group] ? [...acc[r.group], r] : [r];
    return acc;
  }, {});

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label="Buscar"
        >
          <Search className="size-[18px]" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-full max-w-xs items-center gap-2 rounded-md border border-border/70 bg-secondary/60 px-3 text-[13.5px] text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Buscar produtos, clientes...</span>
          <span className="ml-auto hidden rounded border border-border/70 bg-card px-1.5 py-0.5 text-[10px] font-medium sm:inline">⌘K</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl" showClose={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Busca</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 border-b border-border/60 px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produtos, clientes, fornecedores..."
              className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
            />
            {isPending && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {!isPending && query.length >= 2 && results.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
            )}
            {query.length < 2 && (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Digite ao menos 2 letras para buscar.</p>
            )}
            {Object.entries(grouped).map(([group, items]) => {
              const GroupIcon = GROUP_ICON[group] ?? Package;
              return (
                <div key={group} className="mb-1.5 last:mb-0">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setOpen(false);
                        router.push(item.href);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                        <GroupIcon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.title}</span>
                        {item.subtitle && <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

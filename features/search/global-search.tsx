"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { globalSearch, type SearchResultItem } from "@/features/search/actions";

export function GlobalSearch() {
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

  const grouped = results.reduce<Record<string, SearchResultItem[]>>((acc, r) => {
    acc[r.group] = acc[r.group] ? [...acc[r.group], r] : [r];
    return acc;
  }, {});

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-xs items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Buscar produtos, clientes...</span>
        <span className="ml-auto hidden rounded border border-border bg-card px-1.5 py-0.5 text-[10px] sm:inline">⌘K</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-24 translate-y-0 p-0 sm:max-w-lg">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="sr-only">Busca</DialogTitle>
            <Input autoFocus placeholder="Buscar produtos, clientes, fornecedores..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto p-2">
            {isPending && <p className="p-3 text-sm text-muted-foreground">Buscando...</p>}
            {!isPending && query.length >= 2 && results.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
            )}
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="px-3 py-1 text-xs font-medium uppercase text-muted-foreground">{group}</p>
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                    className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium">{item.title}</span>
                    {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

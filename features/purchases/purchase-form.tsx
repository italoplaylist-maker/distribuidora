"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { searchPurchaseProductsAction, createPurchaseAction } from "@/features/purchases/actions";

interface ProductResult {
  id: string;
  name: string;
  cost: string;
  stock: string;
  unit: string;
  sku: string | null;
}

interface CartLine {
  productId: string;
  name: string;
  unitCost: number;
  quantity: number;
  unit: string;
}

interface SupplierOption {
  id: string;
  name: string;
}

export function PurchaseForm({ suppliers, initialProductId }: { suppliers: SupplierOption[]; initialProductId?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [paymentTerm, setPaymentTerm] = useState<"CASH" | "CREDIT">("CASH");
  const [isSearching, startSearch] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  useEffect(() => {
    startSearch(async () => {
      const r = await searchPurchaseProductsAction(query);
      setResults(r);
    });
  }, [query]);

  useEffect(() => {
    if (!initialProductId) return;
    searchPurchaseProductsAction("").then((r) => {
      const match = r.find((p) => p.id === initialProductId);
      if (match) addToCart(match);
    });
  }, [initialProductId]);

  function addToCart(product: ProductResult) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { productId: product.id, name: product.name, unitCost: Number(product.cost), quantity: 1, unit: product.unit }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l)).filter((l) => l.quantity > 0));
  }

  function updateCost(productId: string, cost: string) {
    setCart((prev) => prev.map((l) => (l.productId === productId ? { ...l, unitCost: Number(cost) || 0 } : l)));
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  const total = useMemo(() => cart.reduce((sum, l) => sum + l.unitCost * l.quantity, 0), [cart]);

  function onSubmit() {
    if (!supplierId) {
      toast.error("Selecione um fornecedor");
      return;
    }
    if (cart.length === 0) {
      toast.error("Adicione ao menos um produto");
      return;
    }
    startSubmit(async () => {
      const result = await createPurchaseAction({
        supplierId,
        paymentTerm,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
      });
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível registrar a compra");
        return;
      }
      toast.success("Compra registrada e estoque atualizado!");
      router.push(`/dashboard/purchases/${result.id}`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto por nome, SKU ou código de barras" className="pl-9" />
        </div>
        {isSearching && <p className="text-sm text-muted-foreground">Buscando...</p>}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {results.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="flex flex-col items-start gap-1 rounded-lg border border-border/60 bg-card p-3 text-left shadow-[var(--shadow-xs)] transition-colors hover:border-primary/25 active:scale-[0.98]"
            >
              <span className="text-[13.5px] font-medium leading-tight">{p.name}</span>
              <span className="text-[12px] text-muted-foreground">Estoque: {p.stock}</span>
              <span className="font-semibold text-primary">{formatCurrency(p.cost)}</span>
            </button>
          ))}
        </div>
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {cart.length === 0 && <p className="text-[13.5px] text-muted-foreground">Nenhum item adicionado</p>}
            {cart.map((line) => (
              <div key={line.productId} className="space-y-1.5 rounded-lg border border-border/60 p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex-1 text-[13.5px] font-medium leading-tight">{line.name}</p>
                  <Button type="button" size="icon" variant="ghost" className="size-6 text-destructive" onClick={() => removeLine(line.productId)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => updateQuantity(line.productId, -1)}>
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                    <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => updateQuantity(line.productId, 1)}>
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={line.unitCost}
                    onChange={(e) => updateCost(line.productId, e.target.value)}
                    className="h-8 flex-1"
                  />
                  <span className="text-xs font-medium">{formatCurrency(line.unitCost * line.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          <Select value={paymentTerm} onValueChange={(v) => setPaymentTerm(v as "CASH" | "CREDIT")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">À vista</SelectItem>
              <SelectItem value="CREDIT">A prazo</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex justify-between border-t border-border/70 pt-3.5 text-[19px] font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <Button size="lg" className="w-full" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Registrar compra
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

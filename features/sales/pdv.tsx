"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import { searchProductsAction, createSaleAction, getProductByIdAction } from "@/features/sales/actions";
import { enqueueSale } from "@/lib/offline/sales-queue";
import { BarcodeScannerButton } from "@/features/sales/barcode-scanner";

interface ProductResult {
  id: string;
  name: string;
  price: string;
  stock: string;
  unit: string;
  sku: string | null;
}

interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: string;
}

interface CustomerOption {
  id: string;
  name: string;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "debit", label: "Cartão débito" },
  { value: "credit", label: "Cartão crédito" },
  { value: "fiado", label: "Fiado" },
];

export function PDV({ customers, canDiscount, initialProductId }: { customers: CustomerOption[]; canDiscount: boolean; initialProductId?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState("0");
  const [isSearching, startSearch] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  useEffect(() => {
    startSearch(async () => {
      const r = await searchProductsAction(query);
      setResults(r);
    });
  }, [query]);

  useEffect(() => {
    if (!initialProductId) return;
    getProductByIdAction(initialProductId).then((product) => {
      if (product) addToCart(product);
    });
  }, [initialProductId]);

  function addToCart(product: ProductResult) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: Number(product.price), quantity: 1, unit: product.unit }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  const subtotal = useMemo(() => cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0), [cart]);
  const discountValue = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountValue);

  function onFinalize() {
    if (cart.length === 0) {
      toast.error("Adicione ao menos um produto ao carrinho");
      return;
    }
    if (paymentMethod === "fiado" && !customerId) {
      toast.error("Selecione um cliente para venda fiado");
      return;
    }
    const payload = {
      customerId: customerId || undefined,
      paymentMethod,
      discount: discountValue,
      items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    };

    if (!navigator.onLine) {
      enqueueSale(payload);
      toast.success("Sem conexão: venda salva neste aparelho e será enviada automaticamente quando a internet voltar.");
      setCart([]);
      setDiscount("0");
      return;
    }

    startSubmit(async () => {
      try {
        const result = await createSaleAction(payload);
        if (!result.success) {
          toast.error(result.error ?? "Não foi possível concluir a venda");
          return;
        }
        toast.success("Venda concluída!");
        setCart([]);
        setDiscount("0");
        router.push(`/dashboard/sales/${result.id}`);
        router.refresh();
      } catch {
        enqueueSale(payload);
        toast.success("Sem conexão com o servidor: venda salva neste aparelho e será enviada automaticamente.");
        setCart([]);
        setDiscount("0");
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto por nome, SKU ou código de barras" className="pl-9" autoFocus />
          </div>
          <BarcodeScannerButton onDetected={(code) => setQuery(code)} />
        </div>

        {isSearching && <p className="text-sm text-muted-foreground">Buscando...</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((p) => {
            const low = Number(p.stock) <= 0;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={low}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                <span className="text-sm font-medium leading-tight">{p.name}</span>
                <span className="text-xs text-muted-foreground">Estoque: {p.stock}</span>
                <span className="font-bold text-primary">{formatCurrency(p.price)}</span>
              </button>
            );
          })}
          {!isSearching && results.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum produto encontrado.</p>}
        </div>
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardContent className="space-y-4 pt-5">
          <p className="font-semibold">{cart.length} {cart.length === 1 ? "produto" : "produtos"}</p>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {cart.length === 0 && <p className="text-sm text-muted-foreground">Carrinho vazio</p>}
            {cart.map((line) => (
              <div key={line.productId} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight">{line.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(line.unitPrice)} / {line.unit}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => updateQuantity(line.productId, -1)}>
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
                  <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => updateQuantity(line.productId, 1)}>
                    <Plus className="size-3" />
                  </Button>
                </div>
                <Button type="button" size="icon" variant="ghost" className="size-7 text-destructive" onClick={() => removeLine(line.productId)}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            <Select value={customerId || "none"} onValueChange={(v) => setCustomerId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Consumidor final" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Consumidor final</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canDiscount && (
              <Input type="number" step="0.01" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Desconto (R$)" />
            )}
          </div>

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Desconto</span>
                <span>-{formatCurrency(discountValue)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={onFinalize} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Finalizar venda
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

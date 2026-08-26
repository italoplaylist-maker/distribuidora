"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Minus, Plus, Trash2, Loader2, Package, ShoppingCart, Banknote, QrCode, CreditCard, Landmark, HandCoins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/responsive-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn, formatCurrency } from "@/lib/utils";
import { searchProductsAction, createSaleAction, getProductByIdAction } from "@/features/sales/actions";
import { enqueueSale } from "@/lib/offline/sales-queue";
import { useIsMobile } from "@/hooks/use-media-query";
import { BarcodeScannerButton } from "@/features/sales/barcode-scanner";

interface ProductResult {
  id: string;
  name: string;
  price: string;
  stock: string;
  unit: string;
  sku: string | null;
  brand?: string | null;
  photoUrl?: string | null;
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
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "pix", label: "Pix", icon: QrCode },
  { value: "debit", label: "Débito", icon: CreditCard },
  { value: "credit", label: "Crédito", icon: Landmark },
  { value: "fiado", label: "Fiado", icon: HandCoins },
];

export function PDV({ customers, canDiscount, initialProductId }: { customers: CustomerOption[]; canDiscount: boolean; initialProductId?: string }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState("0");
  const [isSearching, startSearch] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();
  const [sheetProduct, setSheetProduct] = useState<ProductResult | null>(null);
  const [sheetQty, setSheetQty] = useState(1);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  useEffect(() => {
    startSearch(async () => {
      const r = await searchProductsAction(query);
      setResults(r);
    });
  }, [query]);

  useEffect(() => {
    if (!initialProductId) return;
    getProductByIdAction(initialProductId).then((product) => {
      if (product) addToCart(product, 1);
    });
  }, [initialProductId]);

  function addToCart(product: { id: string; name: string; price: string; unit: string }, quantity: number) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: Number(product.price), quantity, unit: product.unit }];
    });
  }

  function onTileClick(product: ProductResult) {
    if (isMobile) {
      setSheetProduct(product);
      setSheetQty(1);
    } else {
      addToCart(product, 1);
      toast.success(`${product.name} adicionado`, { duration: 1200 });
    }
  }

  function confirmSheetAdd() {
    if (!sheetProduct) return;
    addToCart(sheetProduct, sheetQty);
    setSheetProduct(null);
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
  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

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
      setCartSheetOpen(false);
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
        setCartSheetOpen(false);
        router.push(`/dashboard/sales/${result.id}`);
        router.refresh();
      } catch {
        enqueueSale(payload);
        toast.success("Sem conexão com o servidor: venda salva neste aparelho e será enviada automaticamente.");
        setCart([]);
        setDiscount("0");
        setCartSheetOpen(false);
      }
    });
  }

  const checkoutFields = (
    <div className="space-y-3">
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

      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setPaymentMethod(m.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-md border py-3 text-[12.5px] font-medium transition-colors",
              paymentMethod === m.value ? "border-primary bg-primary/8 text-primary" : "border-border/70 text-muted-foreground hover:bg-muted",
            )}
          >
            <m.icon className="size-[18px]" />
            {m.label}
          </button>
        ))}
      </div>

      {canDiscount && (
        <Input type="number" step="0.01" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Desconto (R$)" />
      )}
    </div>
  );

  const totals = (
    <div className="space-y-1 border-t border-border/70 pt-3 text-sm">
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
      <div className="flex justify-between text-[19px] font-semibold">
        <span>Total</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="space-y-3 pb-20 lg:pb-0">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto por nome, SKU ou código de barras"
              className="pl-10"
              autoFocus
            />
          </div>
          <BarcodeScannerButton onDetected={(code) => setQuery(code)} />
        </div>

        {!isSearching && query.length === 0 && (
          <p className="px-0.5 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/70">Produtos recentes</p>
        )}
        {isSearching && <p className="text-sm text-muted-foreground">Buscando...</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((p) => {
            const outOfStock = Number(p.stock) <= 0;
            return (
              <button
                key={p.id}
                onClick={() => onTileClick(p)}
                disabled={outOfStock}
                className="flex flex-col items-start gap-2 rounded-lg border border-border/60 bg-card p-3 text-left shadow-[var(--shadow-card)] transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <div className="flex size-11 items-center justify-center rounded-md bg-secondary">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt={p.name} className="size-full rounded-md object-cover" />
                  ) : (
                    <Package className="size-5 text-muted-foreground/60" />
                  )}
                </div>
                <span className="text-[13.5px] font-medium leading-tight">{p.name}</span>
                <span className="text-[11.5px] text-muted-foreground">Estoque: {p.stock}</span>
                <span className="font-semibold text-primary">{formatCurrency(p.price)}</span>
              </button>
            );
          })}
          {!isSearching && results.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum produto encontrado.</p>}
        </div>
      </div>

      {/* Desktop cart panel */}
      <Card className="hidden h-fit lg:sticky lg:top-20 lg:block">
        <CardContent className="space-y-4 pt-6">
          <p className="font-semibold tracking-[-0.01em]">
            {cart.length} {cart.length === 1 ? "produto" : "produtos"}
          </p>
          <CartLines cart={cart} onUpdateQty={updateQuantity} onRemove={removeLine} />
          {checkoutFields}
          {totals}
          <Button size="lg" className="w-full" onClick={onFinalize} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Finalizar venda
          </Button>
        </CardContent>
      </Card>

      {/* Mobile fixed cart bar */}
      {cart.length > 0 && (
        <button
          onClick={() => setCartSheetOpen(true)}
          className="fixed inset-x-3 bottom-20 z-40 flex items-center justify-between rounded-lg bg-[#111417] px-4 py-3.5 text-white shadow-[var(--shadow-elevated)] lg:hidden"
        >
          <span className="flex items-center gap-2 text-[13.5px]">
            <ShoppingCart className="size-4" />
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </span>
          <span className="flex items-center gap-2 font-semibold">
            {formatCurrency(total)}
            <span className="rounded bg-primary px-2 py-1 text-[12px]">Ver carrinho</span>
          </span>
        </button>
      )}

      {/* Mobile cart/checkout sheet */}
      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent side="bottom" className="max-h-[88vh]">
          <SheetHeader>
            <SheetTitle>
              {cart.length} {cart.length === 1 ? "produto" : "produtos"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto">
            <CartLines cart={cart} onUpdateQty={updateQuantity} onRemove={removeLine} />
            {checkoutFields}
            {totals}
          </div>
          <Button size="lg" className="w-full" onClick={onFinalize} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Finalizar venda
          </Button>
        </SheetContent>
      </Sheet>

      {/* Mobile quick-add sheet */}
      <ResponsiveDialog open={!!sheetProduct} onOpenChange={(o) => !o && setSheetProduct(null)}>
        <ResponsiveDialogContent>
          {sheetProduct && (
            <>
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle className="sr-only">{sheetProduct.name}</ResponsiveDialogTitle>
              </ResponsiveDialogHeader>
              <div className="flex items-center gap-3.5">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  {sheetProduct.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sheetProduct.photoUrl} alt={sheetProduct.name} className="size-full rounded-lg object-cover" />
                  ) : (
                    <Package className="size-7 text-muted-foreground/60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">{sheetProduct.name}</p>
                  <p className="text-[13px] text-muted-foreground">{sheetProduct.brand ?? "Sem marca"} · Estoque: {sheetProduct.stock}</p>
                  <p className="mt-0.5 font-semibold text-primary">{formatCurrency(sheetProduct.price)}</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-5 py-2">
                <Button type="button" size="icon" variant="outline" onClick={() => setSheetQty((q) => Math.max(1, q - 1))}>
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center text-[22px] font-semibold tabular-nums">{sheetQty}</span>
                <Button type="button" size="icon" variant="outline" onClick={() => setSheetQty((q) => q + 1)}>
                  <Plus className="size-4" />
                </Button>
              </div>

              <Button size="lg" className="w-full" onClick={confirmSheetAdd}>
                Adicionar · {formatCurrency(sheetQty * Number(sheetProduct.price))}
              </Button>
            </>
          )}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  );
}

function CartLines({
  cart,
  onUpdateQty,
  onRemove,
}: {
  cart: CartLine[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}) {
  if (cart.length === 0) return <p className="text-sm text-muted-foreground">Carrinho vazio</p>;
  return (
    <div className="max-h-64 space-y-2 overflow-y-auto">
      {cart.map((line) => (
        <div key={line.productId} className="flex items-center gap-2 rounded-md border border-border/60 p-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium leading-tight">{line.name}</p>
            <p className="text-[12px] text-muted-foreground">
              {formatCurrency(line.unitPrice)} / {line.unit}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => onUpdateQty(line.productId, -1)}>
              <Minus className="size-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{line.quantity}</span>
            <Button type="button" size="icon" variant="outline" className="size-7" onClick={() => onUpdateQty(line.productId, 1)}>
              <Plus className="size-3" />
            </Button>
          </div>
          <Button type="button" size="icon" variant="ghost" className="size-7 text-destructive" onClick={() => onRemove(line.productId)}>
            <Trash2 className="size-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

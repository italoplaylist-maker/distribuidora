"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { adjustStockAction } from "@/features/products/actions";

export function StockAdjustSheet({ productId, currentStock, unit }: { productId: string; currentStock: string; unit: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await adjustStockAction({ productId, quantity: Number(quantity), reason });
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível ajustar o estoque");
        return;
      }
      toast.success("Estoque ajustado");
      setOpen(false);
      setQuantity("");
      setReason("");
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" /> Ajustar estoque
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Ajustar estoque</SheetTitle>
            <SheetDescription>Estoque atual: {currentStock} {unit}</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-4 space-y-4 pb-4">
            <div className="space-y-1.5">
              <Label>Quantidade (use negativo para saída)</Label>
              <Input type="number" step="0.001" required value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ex: -5 ou 10" />
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Perda, avaria, contagem de inventário" />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Confirmar ajuste
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

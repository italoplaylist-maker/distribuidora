"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cancelSaleAction } from "@/features/sales/actions";

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await cancelSaleAction({ saleId, reason });
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível cancelar a venda");
        return;
      }
      toast.success("Venda cancelada");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}>
        <Ban className="size-4" /> Cancelar venda
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar venda</DialogTitle>
            <DialogDescription>O estoque será estornado. Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Motivo do cancelamento</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: erro de digitação" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isPending || reason.trim().length < 3}>
              {isPending && <Loader2 className="animate-spin" />}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock, Unlock, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { openCashRegisterAction, closeCashRegisterAction, createCashMovementAction } from "@/features/finance/actions";

export function OpenCashButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("0");
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await openCashRegisterAction({ openingBalance: Number(amount) });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Caixa aberto");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Unlock className="size-4" /> Abrir caixa
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Valor de abertura</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onConfirm} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CloseCashButton({ cashRegisterId, expectedBalance }: { cashRegisterId: string; expectedBalance: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(expectedBalance.toFixed(2));
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await closeCashRegisterAction({ cashRegisterId, informedBalance: Number(amount) });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Caixa fechado");
      setOpen(false);
      router.refresh();
    });
  }

  const difference = Number(amount) - expectedBalance;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Lock className="size-4" /> Fechar caixa
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Saldo esperado: {expectedBalance.toFixed(2)}</p>
            <Label>Valor informado (contagem física)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {difference !== 0 && (
              <p className={difference < 0 ? "text-sm text-destructive" : "text-sm text-success"}>
                Diferença: {difference > 0 ? "+" : ""}
                {difference.toFixed(2)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onConfirm} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />} Confirmar fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CashMovementButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await createCashMovementAction({ type, amount: Number(amount), description });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Movimentação registrada");
      setOpen(false);
      setAmount("");
      setDescription("");
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ArrowDownCircle className="size-4" /> Sangria/Suprimento
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentação de caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={type} onValueChange={(v) => setType(v as "SANGRIA" | "SUPRIMENTO")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SANGRIA">Sangria (retirada)</SelectItem>
                <SelectItem value="SUPRIMENTO">Suprimento (entrada)</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1.5">
              <Label>Valor</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: retirada para depósito" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onConfirm} disabled={isPending || !amount || !description}>
              {isPending && <Loader2 className="animate-spin" />} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

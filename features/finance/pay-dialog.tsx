"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from "@/components/responsive-dialog";
import { formatCurrency } from "@/lib/utils";

export function PayDialog({
  id,
  remaining,
  label,
  action,
}: {
  id: string;
  remaining: number;
  label: string;
  action: (input: { id: string; amount: number }) => Promise<{ success: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await action({ id, amount: Number(amount) });
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível registrar o pagamento");
        return;
      }
      toast.success(`${label} registrado`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
        <HandCoins className="size-3.5" /> {label}
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{label}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>Saldo em aberto: {formatCurrency(remaining)}</ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-1.5">
            <Label>Valor</Label>
            <Input type="number" step="0.01" max={remaining} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <ResponsiveDialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onConfirm} disabled={isPending || Number(amount) <= 0}>
              {isPending && <Loader2 className="animate-spin" />}
              Confirmar
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}

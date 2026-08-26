"use client";

import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cancelPurchaseAction } from "@/features/purchases/actions";

export function CancelPurchaseButton({ purchaseId }: { purchaseId: string }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" className="text-destructive">
          <Ban className="size-4" /> Cancelar compra
        </Button>
      }
      title="Cancelar compra"
      description="O estoque recebido será estornado. Esta ação não pode ser desfeita."
      confirmLabel="Confirmar cancelamento"
      reasonLabel="Motivo do cancelamento"
      reasonPlaceholder="Ex: erro de lançamento"
      successMessage="Compra cancelada"
      onConfirm={(reason) => cancelPurchaseAction({ purchaseId, reason })}
      onSuccess={() => router.refresh()}
    />
  );
}

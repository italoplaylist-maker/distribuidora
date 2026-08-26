"use client";

import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { cancelSaleAction } from "@/features/sales/actions";

export function CancelSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" className="text-destructive">
          <Ban className="size-4" /> Cancelar venda
        </Button>
      }
      title="Cancelar venda"
      description="O estoque será estornado. Esta ação não pode ser desfeita."
      confirmLabel="Confirmar cancelamento"
      reasonLabel="Motivo do cancelamento"
      reasonPlaceholder="Ex: erro de digitação"
      successMessage="Venda cancelada"
      onConfirm={(reason) => cancelSaleAction({ saleId, reason })}
      onSuccess={() => router.refresh()}
    />
  );
}

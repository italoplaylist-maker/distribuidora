"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Truck, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateDeliveryStatusAction } from "@/features/deliveries/actions";
import type { DeliveryStatus } from "@prisma/client";

export function DeliveryStatusActions({ deliveryId, status }: { deliveryId: string; status: DeliveryStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(next: DeliveryStatus) {
    startTransition(async () => {
      const result = await updateDeliveryStatusAction(deliveryId, next);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível atualizar a entrega");
        return;
      }
      toast.success("Status atualizado");
      router.refresh();
    });
  }

  if (status === "DELIVERED" || status === "CANCELED") return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {status === "PENDING" && (
        <Button size="lg" className="w-full sm:w-auto" onClick={() => update("IN_ROUTE")} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Truck className="size-4" />} Sair para entrega
        </Button>
      )}
      {status === "IN_ROUTE" && (
        <>
          <Button size="lg" className="w-full sm:w-auto" onClick={() => update("DELIVERED")} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="size-4" />} Concluir entrega
          </Button>
          <Button size="lg" variant="outline" className="w-full text-destructive sm:w-auto" onClick={() => update("FAILED")} disabled={isPending}>
            <XCircle className="size-4" /> Entrega falhou
          </Button>
        </>
      )}
    </div>
  );
}

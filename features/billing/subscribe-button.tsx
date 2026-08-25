"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subscribeToPlanAction } from "@/features/billing/actions";

export function SubscribeButton({ planId, billingCycle, label }: { planId: string; billingCycle: "monthly" | "yearly"; label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await subscribeToPlanAction(planId, billingCycle);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível ativar o plano");
        return;
      }
      toast.success("Plano ativado com sucesso!");
      router.refresh();
    });
  }

  return (
    <Button className="w-full" onClick={onClick} disabled={isPending}>
      {isPending && <Loader2 className="animate-spin" />}
      {label}
    </Button>
  );
}

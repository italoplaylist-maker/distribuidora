"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { togglePlanActiveAction } from "@/features/admin/actions";

export function TogglePlanButton({ planId, active }: { planId: string; active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await togglePlanActiveAction(planId, !active);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={onClick} disabled={isPending} className={active ? "text-destructive" : "text-success"}>
      {isPending && <Loader2 className="animate-spin" />}
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}

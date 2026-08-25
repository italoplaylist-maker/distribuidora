"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleUserActiveAction } from "@/features/users/actions";

export function ToggleActiveButton({ userId, active }: { userId: string; active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await toggleUserActiveAction(userId, !active);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível atualizar o usuário");
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

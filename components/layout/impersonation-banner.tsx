"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopImpersonationAction } from "@/features/admin/actions";

export function ImpersonationBanner({ adminName, companyName }: { adminName: string; companyName: string }) {
  const [isPending, startTransition] = useTransition();

  function onExit() {
    startTransition(async () => {
      const result = await stopImpersonationAction();
      if (result && !result.success) {
        toast.error(result.error ?? "Não foi possível sair do modo de visualização");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary px-4 py-2.5 text-[13.5px] text-primary-foreground sm:px-6">
      <span className="flex items-center gap-2 font-medium">
        <ShieldAlert className="size-4 shrink-0" />
        {adminName} está visualizando como {companyName}
      </span>
      <Button size="sm" variant="outline" className="h-8 border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10" onClick={onExit} disabled={isPending}>
        {isPending && <Loader2 className="size-3.5 animate-spin" />}
        Voltar ao Super Admin
      </Button>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Ban, CheckCircle2, PauseCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateCompanyStatusAction } from "@/features/admin/actions";
import type { CompanyStatus } from "@prisma/client";

export function CompanyStatusActions({ companyId, status }: { companyId: string; status: CompanyStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function update(next: CompanyStatus) {
    startTransition(async () => {
      const result = await updateCompanyStatusAction(companyId, next);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível atualizar");
        return;
      }
      toast.success("Status atualizado");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "ACTIVE" && (
        <Button size="sm" onClick={() => update("ACTIVE")} disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="size-4" />} Ativar
        </Button>
      )}
      {status !== "SUSPENDED" && (
        <Button size="sm" variant="outline" onClick={() => update("SUSPENDED")} disabled={isPending}>
          <PauseCircle className="size-4" /> Suspender
        </Button>
      )}
      {status !== "PAST_DUE" && (
        <Button size="sm" variant="outline" onClick={() => update("PAST_DUE")} disabled={isPending}>
          <Ban className="size-4" /> Marcar inadimplente
        </Button>
      )}
      {status !== "CANCELED" && (
        <Button size="sm" variant="outline" className="text-destructive" onClick={() => update("CANCELED")} disabled={isPending}>
          <XCircle className="size-4" /> Cancelar
        </Button>
      )}
    </div>
  );
}

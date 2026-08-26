"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { impersonateCompanyAction } from "@/features/admin/actions";

export function ImpersonateButton({ companyId }: { companyId: string }) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await impersonateCompanyAction(companyId);
      if (result && !result.success) {
        toast.error(result.error ?? "Não foi possível entrar nesta empresa");
      }
    });
  }

  return (
    <Button variant="outline" onClick={onClick} disabled={isPending}>
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
      Entrar como esta empresa
    </Button>
  );
}

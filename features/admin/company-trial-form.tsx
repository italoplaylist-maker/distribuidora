"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateCompanyTrialAction } from "@/features/admin/actions";

export function CompanyTrialForm({ companyId, trialEndsAt, trialBehavior }: { companyId: string; trialEndsAt: string; trialBehavior: string }) {
  const router = useRouter();
  const [date, setDate] = useState(trialEndsAt.slice(0, 10));
  const [behavior, setBehavior] = useState(trialBehavior);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const result = await updateCompanyTrialAction(companyId, new Date(date).toISOString(), behavior as "BLOCK_ALL" | "READ_ONLY" | "BLOCK_NEW_OPERATIONS");
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível atualizar o trial");
        return;
      }
      toast.success("Trial atualizado");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5">
        <Label>Fim do trial</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Após expirar</Label>
        <Select value={behavior} onValueChange={setBehavior}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BLOCK_ALL">Bloquear totalmente</SelectItem>
            <SelectItem value="READ_ONLY">Somente leitura</SelectItem>
            <SelectItem value="BLOCK_NEW_OPERATIONS">Bloquear novas operações</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button size="sm" onClick={onSave} disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />} Salvar
      </Button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateCompanyPlanAction, updateCompanyTrialAction } from "@/features/admin/actions";

interface PlanOption {
  id: string;
  name: string;
}

export function CompanyPlanForm({ companyId, planId, plans }: { companyId: string; planId?: string; plans: PlanOption[] }) {
  const router = useRouter();
  const [value, setValue] = useState(planId ?? "");
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const result = await updateCompanyPlanAction(companyId, value);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível alterar o plano");
        return;
      }
      toast.success("Plano alterado");
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Plano" />
        </SelectTrigger>
        <SelectContent>
          {plans.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" onClick={onSave} disabled={isPending || !value || value === planId}>
        {isPending && <Loader2 className="animate-spin" />} Salvar
      </Button>
    </div>
  );
}

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
        <Label className="text-zinc-400">Fim do trial</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border-zinc-700 bg-zinc-900 text-zinc-100" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-zinc-400">Após expirar</Label>
        <Select value={behavior} onValueChange={setBehavior}>
          <SelectTrigger className="w-48 border-zinc-700 bg-zinc-900 text-zinc-100">
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

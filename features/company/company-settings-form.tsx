"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { updateCompanySettingsAction } from "@/features/company/actions";

interface Settings {
  allowNegativeStock: boolean;
  requireUniqueBarcode: boolean;
  lowStockAlert: boolean;
  defaultPaymentTermDays: number;
}

export function CompanySettingsForm({ defaultValues }: { defaultValues: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState(defaultValues);
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    startTransition(async () => {
      const result = await updateCompanySettingsAction(values);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível salvar");
        return;
      }
      toast.success("Preferências salvas");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Exigir código de barras único</p>
          <p className="text-xs text-muted-foreground">Impede cadastrar dois produtos com o mesmo código</p>
        </div>
        <Switch checked={values.requireUniqueBarcode} onCheckedChange={(v) => setValues((s) => ({ ...s, requireUniqueBarcode: v }))} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Permitir estoque negativo</p>
          <p className="text-xs text-muted-foreground">Permite vender/comprar mesmo sem saldo suficiente</p>
        </div>
        <Switch checked={values.allowNegativeStock} onCheckedChange={(v) => setValues((s) => ({ ...s, allowNegativeStock: v }))} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Alertas de estoque baixo</p>
          <p className="text-xs text-muted-foreground">Mostrar avisos no dashboard quando o estoque estiver baixo</p>
        </div>
        <Switch checked={values.lowStockAlert} onCheckedChange={(v) => setValues((s) => ({ ...s, lowStockAlert: v }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Prazo padrão para vendas/compras a prazo (dias)</Label>
        <Input
          type="number"
          className="max-w-[160px]"
          value={values.defaultPaymentTermDays}
          onChange={(e) => setValues((s) => ({ ...s, defaultPaymentTermDays: Number(e.target.value) }))}
        />
      </div>
      <Button onClick={onSubmit} disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Salvar preferências
      </Button>
    </div>
  );
}

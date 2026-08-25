"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createPlanAction, updatePlanAction } from "@/features/admin/actions";
import type { PlanInput } from "@/schemas/admin";

const FEATURE_OPTIONS = [
  "advanced_reports",
  "delivery_management",
  "barcode_scanner",
  "multiple_cash_registers",
  "financial_reports",
  "inventory",
  "offline_mode",
  "api_access",
];

export function PlanFormDialog({ plan }: { plan?: (PlanInput & { id: string }) | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PlanInput>(
    plan ?? {
      name: "",
      slug: "",
      description: "",
      priceMonthly: 0,
      priceYearly: 0,
      maxUsers: 1,
      maxProducts: 100,
      maxCustomers: 100,
      maxSuppliers: 20,
      maxStorageMb: 1024,
      features: [],
      active: true,
    },
  );
  const [isPending, startTransition] = useTransition();

  function toggleFeature(feature: string) {
    setForm((f) => ({
      ...f,
      features: f.features.includes(feature) ? f.features.filter((x) => x !== feature) : [...f.features, feature],
    }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = plan ? await updatePlanAction(plan.id, form) : await createPlanAction(form);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível salvar o plano");
        return;
      }
      toast.success(plan ? "Plano atualizado" : "Plano criado");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button size={plan ? "sm" : "default"} variant={plan ? "outline" : "default"} onClick={() => setOpen(true)}>
        {plan ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}
        {plan ? "Editar" : "Novo plano"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{plan ? "Editar plano" : "Novo plano"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Preço mensal</Label>
                <Input type="number" step="0.01" value={form.priceMonthly} onChange={(e) => setForm((f) => ({ ...f, priceMonthly: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Preço anual</Label>
                <Input type="number" step="0.01" value={form.priceYearly} onChange={(e) => setForm((f) => ({ ...f, priceYearly: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Máx. usuários (-1 = ilimitado)</Label>
                <Input type="number" value={form.maxUsers} onChange={(e) => setForm((f) => ({ ...f, maxUsers: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Máx. produtos</Label>
                <Input type="number" value={form.maxProducts} onChange={(e) => setForm((f) => ({ ...f, maxProducts: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Máx. clientes</Label>
                <Input type="number" value={form.maxCustomers} onChange={(e) => setForm((f) => ({ ...f, maxCustomers: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Máx. fornecedores</Label>
                <Input type="number" value={form.maxSuppliers} onChange={(e) => setForm((f) => ({ ...f, maxSuppliers: Number(e.target.value) }))} />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Recursos inclusos</Label>
              <div className="grid grid-cols-2 gap-2">
                {FEATURE_OPTIONS.map((feature) => (
                  <label key={feature} className="flex items-center gap-2 text-sm">
                    <Switch checked={form.features.includes(feature)} onCheckedChange={() => toggleFeature(feature)} />
                    {feature}
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

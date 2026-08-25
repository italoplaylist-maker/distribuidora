"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";
import { registerCompanyAction } from "@/features/auth/actions";
import { Loader2, Check } from "lucide-react";

interface PlanOption {
  id: string;
  name: string;
  priceMonthly: string;
  maxUsers: number;
  maxProducts: number;
}

export function SignupForm({ plans }: { plans: PlanOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [form, setForm] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    companyEmail: "",
    phone: "",
    adminName: "",
    adminEmail: "",
    password: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await registerCompanyAction({ ...form, planId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Empresa criada! Seu teste grátis de 3 dias começou.");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium">Escolha um plano</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {plans.map((plan) => (
            <button
              type="button"
              key={plan.id}
              onClick={() => setPlanId(plan.id)}
              className={cn(
                "relative rounded-xl border p-4 text-left transition-colors",
                planId === plan.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
              )}
            >
              {planId === plan.id && <Check className="absolute right-3 top-3 size-4 text-primary" />}
              <p className="font-semibold">{plan.name}</p>
              <p className="text-lg font-bold">{formatCurrency(plan.priceMonthly)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
              <p className="text-xs text-muted-foreground">
                Até {plan.maxUsers < 0 ? "usuários ilimitados" : `${plan.maxUsers} usuários`}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Razão social</Label>
          <Input required value={form.razaoSocial} onChange={(e) => update("razaoSocial", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Nome fantasia</Label>
          <Input required value={form.nomeFantasia} onChange={(e) => update("nomeFantasia", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>CNPJ</Label>
          <Input required value={form.cnpj} onChange={(e) => update("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
        </div>
        <div className="space-y-1.5">
          <Label>E-mail da empresa</Label>
          <Input required type="email" value={form.companyEmail} onChange={(e) => update("companyEmail", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(00) 00000-0000" />
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-3 text-sm font-medium">Sua conta de administrador</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Seu nome</Label>
            <Input required value={form.adminName} onChange={(e) => update("adminName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Seu e-mail</Label>
            <Input required type="email" value={form.adminEmail} onChange={(e) => update("adminEmail", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Crie uma senha</Label>
            <Input required type="password" minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} />
          </div>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Começar teste grátis de 3 dias
      </Button>
    </form>
  );
}

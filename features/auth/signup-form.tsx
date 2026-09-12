"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerCompanyAction } from "@/features/auth/actions";
import { Loader2 } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
      const result = await registerCompanyAction(form);
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

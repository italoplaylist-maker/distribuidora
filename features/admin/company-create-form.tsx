"use client";

import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createCompanySchema, type CreateCompanyInput } from "@/schemas/admin";
import { createCompanyAction } from "@/features/admin/actions";

export function CompanyCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [created, setCreated] = useState<{ companyId: string; password: string } | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(createCompanySchema) as Resolver<CreateCompanyInput>,
    defaultValues: { status: "TRIAL", trialDays: 3 },
  });

  function onSubmit(data: CreateCompanyInput) {
    startTransition(async () => {
      const result = await createCompanyAction(data);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível criar a empresa");
        return;
      }
      setCreated({ companyId: result.id!, password: result.temporaryPassword! });
      toast.success("Empresa criada");
    });
  }

  function copyPassword() {
    if (!created) return;
    navigator.clipboard.writeText(created.password);
    toast.success("Senha copiada");
  }

  if (created) {
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-5" />
            <p className="font-semibold">Empresa criada com sucesso</p>
          </div>
          <p className="text-[13.5px] text-muted-foreground">
            Senha temporária do administrador da empresa — copie e envie ao cliente, ela não será exibida novamente:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border border-border/60 bg-card px-3 py-2.5 text-[14px] font-medium tracking-wide">{created.password}</code>
            <Button type="button" variant="outline" size="icon" onClick={copyPassword} aria-label="Copiar senha">
              <Copy className="size-4" />
            </Button>
          </div>
          <Button onClick={() => router.push(`/admin/companies/${created.companyId}`)} className="w-full sm:w-auto">
            Ver empresa
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Razão social</Label>
          <Input {...register("razaoSocial")} placeholder="Ex: Distribuidora Silva Bebidas Ltda" />
          {errors.razaoSocial && <p className="text-xs text-destructive">{errors.razaoSocial.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Nome fantasia</Label>
          <Input {...register("nomeFantasia")} placeholder="Ex: Distribuidora Silva" />
          {errors.nomeFantasia && <p className="text-xs text-destructive">{errors.nomeFantasia.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>CNPJ</Label>
          <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
          {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>E-mail da empresa</Label>
          <Input type="email" {...register("companyEmail")} />
          {errors.companyEmail && <p className="text-xs text-destructive">{errors.companyEmail.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input {...register("phone")} placeholder="Opcional" />
        </div>
        <div className="space-y-1.5">
          <Label>Status inicial</Label>
          <Select value={watch("status")} onValueChange={(v) => setValue("status", v as "TRIAL" | "ACTIVE")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRIAL">Trial</SelectItem>
              <SelectItem value="ACTIVE">Ativa (assinatura já paga)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {watch("status") === "TRIAL" && (
          <div className="space-y-1.5">
            <Label>Dias de trial</Label>
            <Input type="number" min={1} max={90} {...register("trialDays")} />
          </div>
        )}

        <div className="space-y-1.5 sm:col-span-2">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Administrador da empresa</p>
        </div>
        <div className="space-y-1.5">
          <Label>Nome do responsável</Label>
          <Input {...register("adminName")} />
          {errors.adminName && <p className="text-xs text-destructive">{errors.adminName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>E-mail de acesso</Label>
          <Input type="email" {...register("adminEmail")} />
          {errors.adminEmail && <p className="text-xs text-destructive">{errors.adminEmail.message}</p>}
        </div>
      </div>

      <p className="text-[12.5px] text-muted-foreground">
        Uma senha temporária será gerada automaticamente para o administrador da empresa após o cadastro.
      </p>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="animate-spin" />}
        Criar empresa
      </Button>
    </form>
  );
}

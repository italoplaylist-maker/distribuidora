"use client";

import { useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompanySchema, type UpdateCompanyInput } from "@/schemas/admin";
import { updateCompanyAction } from "@/features/admin/actions";

export function CompanyEditForm({ companyId, defaultValues }: { companyId: string; defaultValues: UpdateCompanyInput }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateCompanyInput>({
    resolver: zodResolver(updateCompanySchema) as Resolver<UpdateCompanyInput>,
    defaultValues,
  });

  function onSubmit(data: UpdateCompanyInput) {
    startTransition(async () => {
      const result = await updateCompanyAction(companyId, data);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível salvar");
        return;
      }
      toast.success("Empresa atualizada");
      router.push(`/admin/companies/${companyId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Razão social</Label>
          <Input {...register("razaoSocial")} />
          {errors.razaoSocial && <p className="text-xs text-destructive">{errors.razaoSocial.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Nome fantasia</Label>
          <Input {...register("nomeFantasia")} />
          {errors.nomeFantasia && <p className="text-xs text-destructive">{errors.nomeFantasia.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>CNPJ</Label>
          <Input {...register("cnpj")} />
          {errors.cnpj && <p className="text-xs text-destructive">{errors.cnpj.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label>WhatsApp</Label>
          <Input {...register("whatsapp")} />
        </div>
        <div className="space-y-1.5">
          <Label>Cidade</Label>
          <Input {...register("city")} />
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Input {...register("state")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Endereço</Label>
          <Input {...register("address")} />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="animate-spin" />}
        Salvar alterações
      </Button>
    </form>
  );
}

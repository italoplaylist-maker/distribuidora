"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { companySchema, type CompanyProfileInput } from "@/schemas/user";
import { updateCompanyProfileAction } from "@/features/company/actions";

export function CompanyProfileForm({ defaultValues }: { defaultValues: CompanyProfileInput }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit } = useForm<CompanyProfileInput>({ resolver: zodResolver(companySchema), defaultValues });

  function onSubmit(data: CompanyProfileInput) {
    startTransition(async () => {
      const result = await updateCompanyProfileAction(data);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível salvar");
        return;
      }
      toast.success("Dados atualizados");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Razão social</Label>
          <Input {...register("razaoSocial")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Nome fantasia</Label>
          <Input {...register("nomeFantasia")} />
        </div>
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input type="email" {...register("email")} />
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
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Salvar alterações
      </Button>
    </form>
  );
}

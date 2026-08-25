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
import { supplierSchema, type SupplierInput } from "@/schemas/supplier";
import { createSupplierAction, updateSupplierAction } from "@/features/suppliers/actions";

export function SupplierForm({ supplier }: { supplier?: (SupplierInput & { id: string }) | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema) as Resolver<SupplierInput>,
    defaultValues: supplier ?? { name: "", active: true },
  });

  function onSubmit(data: SupplierInput) {
    startTransition(async () => {
      const result = supplier ? await updateSupplierAction(supplier.id, data) : await createSupplierAction(data);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível salvar o fornecedor");
        return;
      }
      toast.success(supplier ? "Fornecedor atualizado" : "Fornecedor cadastrado");
      router.push("/dashboard/suppliers");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Nome</Label>
          <Input {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>CNPJ/CPF</Label>
          <Input {...register("document")} />
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
          <Label>E-mail</Label>
          <Input type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Endereço</Label>
          <Input {...register("address")} />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {supplier ? "Salvar alterações" : "Cadastrar fornecedor"}
      </Button>
    </form>
  );
}

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
import { customerSchema, type CustomerInput } from "@/schemas/customer";
import { createCustomerAction, updateCustomerAction } from "@/features/customers/actions";

export function CustomerForm({ customer }: { customer?: (CustomerInput & { id: string }) | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema) as Resolver<CustomerInput>,
    defaultValues: customer ?? { name: "", creditLimit: 0, active: true },
  });

  function onSubmit(data: CustomerInput) {
    startTransition(async () => {
      const result = customer ? await updateCustomerAction(customer.id, data) : await createCustomerAction(data);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível salvar o cliente");
        return;
      }
      toast.success(customer ? "Cliente atualizado" : "Cliente cadastrado");
      router.push("/dashboard/customers");
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
          <Label>CPF/CNPJ</Label>
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
          <Label>Limite de crédito</Label>
          <Input type="number" step="0.01" {...register("creditLimit")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Endereço</Label>
          <Input {...register("address")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Observações</Label>
          <Input {...register("notes")} />
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        {customer ? "Salvar alterações" : "Cadastrar cliente"}
      </Button>
    </form>
  );
}

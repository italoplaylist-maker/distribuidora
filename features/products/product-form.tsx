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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { productSchema, type ProductInput } from "@/schemas/product";
import { createProductAction, updateProductAction } from "@/features/products/actions";

interface Option {
  id: string;
  name: string;
}

export function ProductForm({
  categories,
  brands,
  product,
}: {
  categories: Option[];
  brands: Option[];
  product?: (ProductInput & { id: string }) | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema) as Resolver<ProductInput>,
    defaultValues: product ?? {
      name: "",
      unit: "UN",
      cost: 0,
      price: 0,
      stock: 0,
      minStock: 0,
      maxStock: 0,
      active: true,
    },
  });

  function onSubmit(data: ProductInput) {
    startTransition(async () => {
      const result = product ? await updateProductAction(product.id, data) : await createProductAction(data);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível salvar o produto");
        return;
      }
      toast.success(product ? "Produto atualizado" : "Produto cadastrado");
      router.push("/dashboard/products");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Nome do produto</Label>
          <Input {...register("name")} placeholder="Ex: Original 600ml" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>SKU</Label>
          <Input {...register("sku")} placeholder="Opcional" />
        </div>
        <div className="space-y-1.5">
          <Label>Código de barras</Label>
          <Input {...register("barcode")} placeholder="Opcional" />
        </div>
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={watch("categoryId") ?? ""} onValueChange={(v) => setValue("categoryId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Marca</Label>
          <Select value={watch("brandId") ?? ""} onValueChange={(v) => setValue("brandId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Unidade</Label>
          <Input {...register("unit")} placeholder="UN, CX, FD..." />
        </div>
        <div className="space-y-1.5">
          <Label>Custo</Label>
          <Input type="number" step="0.01" {...register("cost")} />
        </div>
        <div className="space-y-1.5">
          <Label>Preço de venda</Label>
          <Input type="number" step="0.01" {...register("price")} />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>
        {!product && (
          <div className="space-y-1.5">
            <Label>Estoque inicial</Label>
            <Input type="number" step="0.001" {...register("stock")} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label>Estoque mínimo</Label>
          <Input type="number" step="0.001" {...register("minStock")} />
        </div>
        <div className="space-y-1.5">
          <Label>Estoque máximo</Label>
          <Input type="number" step="0.001" {...register("maxStock")} />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending && <Loader2 className="animate-spin" />}
        {product ? "Salvar alterações" : "Cadastrar produto"}
      </Button>
    </form>
  );
}

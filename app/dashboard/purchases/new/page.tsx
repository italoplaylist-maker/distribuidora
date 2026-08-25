import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listActiveSuppliers } from "@/features/purchases/queries";
import { PurchaseForm } from "@/features/purchases/purchase-form";
import { EmptyState } from "@/components/empty-state";
import { Building2 } from "lucide-react";

export default async function NewPurchasePage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
  const { productId } = await searchParams;
  const tenant = await getCurrentTenant();
  const suppliers = await listActiveSuppliers(tenant.companyId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nova compra</h1>
      {suppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum fornecedor cadastrado"
          description="Cadastre um fornecedor antes de registrar uma compra."
          actionLabel="Novo fornecedor"
          actionHref="/dashboard/suppliers/new"
        />
      ) : (
        <PurchaseForm suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))} initialProductId={productId} />
      )}
    </div>
  );
}

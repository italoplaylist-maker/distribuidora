import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { roleHasPermission, PERMISSIONS } from "@/lib/permissions/permissions";
import { getRecentCustomers } from "@/features/sales/queries";
import { PDV } from "@/features/sales/pdv";

export default async function NewSalePage({ searchParams }: { searchParams: Promise<{ productId?: string; customerId?: string }> }) {
  const { productId } = await searchParams;
  const tenant = await getCurrentTenant();
  const customers = await getRecentCustomers(tenant.companyId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Nova venda</h1>
      <PDV
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        canDiscount={roleHasPermission(tenant.role, PERMISSIONS.SALES_DISCOUNT)}
        initialProductId={productId}
      />
    </div>
  );
}

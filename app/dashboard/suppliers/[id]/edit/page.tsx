import { notFound } from "next/navigation";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { getSupplierOrThrow } from "@/features/suppliers/queries";
import { SupplierForm } from "@/features/suppliers/supplier-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let supplier;
  try {
    supplier = await getSupplierOrThrow(tenant.companyId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Editar fornecedor" />
      <Card>
        <CardContent className="pt-5">
          <SupplierForm
            supplier={{
              id: supplier.id,
              name: supplier.name,
              document: supplier.document ?? undefined,
              phone: supplier.phone ?? undefined,
              whatsapp: supplier.whatsapp ?? undefined,
              email: supplier.email ?? undefined,
              address: supplier.address ?? undefined,
              active: supplier.active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

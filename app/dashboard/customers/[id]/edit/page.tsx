import { notFound } from "next/navigation";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { getCustomerOrThrow } from "@/features/customers/queries";
import { CustomerForm } from "@/features/customers/customer-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let customer;
  try {
    customer = await getCustomerOrThrow(tenant.companyId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Editar cliente" />
      <Card>
        <CardContent className="pt-5">
          <CustomerForm
            customer={{
              id: customer.id,
              name: customer.name,
              document: customer.document ?? undefined,
              phone: customer.phone ?? undefined,
              whatsapp: customer.whatsapp ?? undefined,
              address: customer.address ?? undefined,
              creditLimit: customer.creditLimit.toNumber(),
              notes: customer.notes ?? undefined,
              active: customer.active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

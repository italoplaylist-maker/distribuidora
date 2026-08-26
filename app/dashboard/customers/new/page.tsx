import { CustomerForm } from "@/features/customers/customer-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Novo cliente" />
      <Card>
        <CardContent className="pt-5">
          <CustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}

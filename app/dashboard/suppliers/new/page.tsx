import { SupplierForm } from "@/features/suppliers/supplier-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Novo fornecedor" />
      <Card>
        <CardContent className="pt-5">
          <SupplierForm />
        </CardContent>
      </Card>
    </div>
  );
}

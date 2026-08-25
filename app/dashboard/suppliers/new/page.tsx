import { SupplierForm } from "@/features/suppliers/supplier-form";
import { Card, CardContent } from "@/components/ui/card";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Novo fornecedor</h1>
      <Card>
        <CardContent className="pt-5">
          <SupplierForm />
        </CardContent>
      </Card>
    </div>
  );
}

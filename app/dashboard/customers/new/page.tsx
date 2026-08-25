import { CustomerForm } from "@/features/customers/customer-form";
import { Card, CardContent } from "@/components/ui/card";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Novo cliente</h1>
      <Card>
        <CardContent className="pt-5">
          <CustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}

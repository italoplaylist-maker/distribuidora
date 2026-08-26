import { listActivePlansAdmin } from "@/features/admin/queries";
import { CompanyCreateForm } from "@/features/admin/company-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default async function NewCompanyPage() {
  const plans = await listActivePlansAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Nova empresa" description="Cadastre uma empresa diretamente pela plataforma" />
      <Card>
        <CardContent className="pt-6">
          <CompanyCreateForm plans={plans.map((p) => ({ id: p.id, name: p.name }))} />
        </CardContent>
      </Card>
    </div>
  );
}

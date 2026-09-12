import { CompanyCreateForm } from "@/features/admin/company-create-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default function NewCompanyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Nova empresa" description="Cadastre uma empresa diretamente pela plataforma" />
      <Card>
        <CardContent className="pt-6">
          <CompanyCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}

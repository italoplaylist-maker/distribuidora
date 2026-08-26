import { notFound } from "next/navigation";
import { getCompanyAdminDetail } from "@/features/admin/queries";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { CompanyEditForm } from "@/features/admin/company-edit-form";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let company;
  try {
    company = await getCompanyAdminDetail(id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Editar empresa" description={company.nomeFantasia} />
      <Card>
        <CardContent className="pt-6">
          <CompanyEditForm
            companyId={company.id}
            defaultValues={{
              razaoSocial: company.razaoSocial,
              nomeFantasia: company.nomeFantasia,
              cnpj: company.cnpj,
              email: company.email,
              phone: company.phone ?? undefined,
              whatsapp: company.whatsapp ?? undefined,
              address: company.address ?? undefined,
              city: company.city ?? undefined,
              state: company.state ?? undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

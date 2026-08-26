import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { CompanyProfileForm } from "@/features/company/company-profile-form";
import { CompanySettingsForm } from "@/features/company/company-settings-form";

export default async function CompanySettingsPage() {
  const tenant = await getCurrentTenant();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Minha empresa" />

      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyProfileForm
            defaultValues={{
              razaoSocial: tenant.company.razaoSocial,
              nomeFantasia: tenant.company.nomeFantasia,
              email: tenant.company.email,
              phone: tenant.company.phone ?? undefined,
              whatsapp: tenant.company.whatsapp ?? undefined,
              address: tenant.company.address ?? undefined,
              city: tenant.company.city ?? undefined,
              state: tenant.company.state ?? undefined,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências de estoque e vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanySettingsForm
            defaultValues={{
              allowNegativeStock: tenant.company.settings?.allowNegativeStock ?? false,
              requireUniqueBarcode: tenant.company.settings?.requireUniqueBarcode ?? true,
              lowStockAlert: tenant.company.settings?.lowStockAlert ?? true,
              defaultPaymentTermDays: tenant.company.settings?.defaultPaymentTermDays ?? 30,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

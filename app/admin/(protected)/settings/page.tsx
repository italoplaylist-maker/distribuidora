import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ChangePasswordForm } from "@/features/admin/change-password-form";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <PageHeader title="Minha conta" description="Altere a senha de acesso ao painel" />
      <Card>
        <CardContent className="pt-6">
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

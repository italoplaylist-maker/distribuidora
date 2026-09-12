import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { ChangePasswordForm } from "@/features/users/change-password-form";

export default function AccountSettingsPage() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <PageHeader title="Minha conta" description="Altere sua senha de acesso ao sistema" />
      <Card>
        <CardContent className="pt-6">
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}

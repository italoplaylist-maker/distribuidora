import { Card, CardContent } from "@/components/ui/card";
import { AdminLoginForm } from "@/features/auth/admin-login-form";
import { BrandLogo } from "@/components/brand-logo";

export default function AdminLoginPage() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <BrandLogo size={52} className="rounded-xl" />
          <span className="text-[17px] font-semibold tracking-tight">Plataforma · Super Admin</span>
          <span className="text-[12.5px] text-muted-foreground">Acesso restrito à administração do SaaS</span>
        </div>
        <Card>
          <CardContent className="pt-6">
            <AdminLoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

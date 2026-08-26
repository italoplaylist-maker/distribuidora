import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AdminLoginForm } from "@/features/auth/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15">
            <ShieldCheck className="size-6 text-primary" />
          </div>
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

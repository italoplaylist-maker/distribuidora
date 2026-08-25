import { ShieldCheck } from "lucide-react";
import { AdminLoginForm } from "@/features/auth/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0D0F] px-4 text-zinc-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/20">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Plataforma · Super Admin</span>
          <span className="text-xs text-zinc-500">Acesso restrito à administração do SaaS</span>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-[#111315] p-6 shadow-xl">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { BarChart3, Boxes, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/login-form";

const HIGHLIGHTS = [
  { icon: Boxes, text: "Estoque e vendas em tempo real" },
  { icon: BarChart3, text: "Financeiro completo, sem planilhas" },
  { icon: ShieldCheck, text: "Seus dados isolados e protegidos" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#111417] p-12 text-zinc-50 lg:flex">
        <div
          className="pointer-events-none absolute -left-24 -top-24 size-[420px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #EF3035 0%, transparent 70%)" }}
        />
        <Link href="/" className="relative text-lg font-bold tracking-tight">
          Distribuidora<span className="text-primary">SaaS</span>
        </Link>

        <div className="relative max-w-md space-y-8">
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-[-0.02em]">
            Gestão completa para a sua distribuidora, em um só lugar.
          </h1>
          <div className="space-y-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.text} className="flex items-center gap-3 text-[14.5px] text-zinc-300">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/8">
                  <h.icon className="size-4.5 text-primary" />
                </span>
                {h.text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[13px] text-zinc-500">© {new Date().getFullYear()} Distribuidora SaaS</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 bg-background px-6 py-16">
        <Link href="/" className="text-lg font-bold tracking-tight lg:hidden">
          Distribuidora<span className="text-primary">SaaS</span>
        </Link>

        <div className="w-full max-w-sm space-y-7">
          <div className="space-y-1.5">
            <h2 className="text-[24px] font-semibold tracking-[-0.015em]">Entrar</h2>
            <p className="text-[14px] text-muted-foreground">Acesse o painel da sua empresa</p>
          </div>

          <LoginForm redirectTo="/dashboard" />

          <p className="text-center text-[13.5px] text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Criar empresa grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignupForm } from "@/features/auth/signup-form";
import { BrandLogo } from "@/components/brand-logo";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex flex-col items-center gap-2.5 text-center">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo size={40} />
            <span className="text-xl font-bold tracking-tight">
              Distribuidora<span className="text-primary">SaaS</span>
            </span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Crie sua empresa</CardTitle>
            <CardDescription>3 dias grátis, sem cartão de crédito.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

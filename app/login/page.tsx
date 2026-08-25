import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Distribuidora<span className="text-primary">SaaS</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse o painel da sua empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm redirectTo="/dashboard" />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Ainda não tem conta?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Criar empresa grátis
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

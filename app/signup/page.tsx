import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignupForm } from "@/features/auth/signup-form";

export default async function SignupPage() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Distribuidora<span className="text-primary">SaaS</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Crie sua empresa</CardTitle>
            <CardDescription>3 dias grátis, sem cartão de crédito.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm
              plans={plans.map((p) => ({
                id: p.id,
                name: p.name,
                priceMonthly: p.priceMonthly.toString(),
                maxUsers: p.maxUsers,
                maxProducts: p.maxProducts,
              }))}
            />
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

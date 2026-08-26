import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SignupForm } from "@/features/auth/signup-form";
import { BrandLogo } from "@/components/brand-logo";

// Must stay dynamic: this reads Plan rows the Super Admin can add/edit at
// any time. Without this, Next prerenders the page at build time and bakes
// in whatever plans existed then (and the build would require a reachable,
// already-migrated DATABASE_URL).
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

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

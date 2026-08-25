import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Boxes, Receipt, ShieldCheck, Smartphone, Truck } from "lucide-react";

const features = [
  { icon: Boxes, title: "Estoque em tempo real", desc: "Controle completo com custo médio, inventário e alertas de estoque baixo." },
  { icon: Receipt, title: "PDV rápido", desc: "Venda em poucos toques, no computador ou no celular, com ou sem cliente cadastrado." },
  { icon: BarChart3, title: "Financeiro completo", desc: "Contas a pagar, a receber, caixa e relatórios gerenciais em um só lugar." },
  { icon: Truck, title: "Entregas", desc: "Organize motoristas, rotas e comprovantes de entrega." },
  { icon: Smartphone, title: "Mobile first", desc: "Instale como aplicativo e opere de qualquer lugar, mesmo offline." },
  { icon: ShieldCheck, title: "Multiempresa e seguro", desc: "Cada distribuidora com seus dados totalmente isolados e protegidos." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight">
          Distribuidora<span className="text-primary">SaaS</span>
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Começar grátis</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Gestão completa para a sua distribuidora
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Vendas, estoque, financeiro e entregas em uma plataforma rápida, moderna e feita para celular.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Testar grátis por 3 dias</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-5">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="size-5 text-primary" />
                </div>
                <p className="font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

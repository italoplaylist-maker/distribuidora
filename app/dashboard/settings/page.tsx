import Link from "next/link";
import { Building2, Users, ScrollText, CreditCard, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

const ITEMS = [
  { href: "/dashboard/settings/company", label: "Minha empresa", desc: "Dados cadastrais e preferências operacionais", icon: Building2 },
  { href: "/dashboard/settings/users", label: "Usuários", desc: "Gerencie quem acessa o sistema e suas permissões", icon: Users },
  { href: "/dashboard/settings/billing", label: "Plano e assinatura", desc: "Veja seu plano atual, uso e faça upgrade", icon: CreditCard },
  { href: "/dashboard/settings/audit", label: "Auditoria", desc: "Histórico de ações realizadas no sistema", icon: ScrollText },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Configurações" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="transition-colors hover:border-primary/25">
              <CardContent className="flex items-center gap-4 pt-5">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-[12.5px] text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <SlidersHorizontal className="size-3.5 shrink-0" /> Mais preferências de estoque e vendas estão disponíveis em Minha empresa.
      </p>
    </div>
  );
}

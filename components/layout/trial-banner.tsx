import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrialBanner({ status, trialEndsAt }: { status: string; trialEndsAt: Date }) {
  if (status === "ACTIVE") return null;

  if (status === "TRIAL") {
    const daysLeft = Math.max(0, differenceInCalendarDays(trialEndsAt, new Date()));
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        <span className="flex items-center gap-2">
          <Clock className="size-4" />
          {daysLeft > 0
            ? `Seu período de teste termina em ${daysLeft} dia${daysLeft === 1 ? "" : "s"}.`
            : "Seu período de teste termina hoje."}
        </span>
        <Button asChild size="sm" variant="secondary" className="h-8">
          <Link href="/dashboard/settings/billing">Assinar plano</Link>
        </Button>
      </div>
    );
  }

  if (status === "PAST_DUE") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 bg-warning px-4 py-2.5 text-sm text-white">
        <span className="flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Seu período de teste terminou. Escolha um plano para continuar utilizando o sistema.
        </span>
        <Button asChild size="sm" variant="secondary" className="h-8">
          <Link href="/dashboard/settings/billing">Ver planos</Link>
        </Button>
      </div>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <div className="flex items-center gap-2 bg-destructive px-4 py-2.5 text-sm text-destructive-foreground">
        <AlertTriangle className="size-4" />
        Empresa suspensa. Regularize sua assinatura para voltar a operar.
      </div>
    );
  }

  return null;
}

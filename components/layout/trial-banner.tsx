import { differenceInCalendarDays } from "date-fns";
import { AlertTriangle, Clock } from "lucide-react";

export function TrialBanner({ status, trialEndsAt }: { status: string; trialEndsAt: Date }) {
  if (status === "ACTIVE") return null;

  if (status === "TRIAL") {
    const daysLeft = Math.max(0, differenceInCalendarDays(trialEndsAt, new Date()));
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/15 bg-primary/8 px-4 py-2.5 text-[13.5px] sm:px-6">
        <span className="flex items-center gap-2 font-medium text-primary">
          <Clock className="size-4 shrink-0" />
          {daysLeft > 0
            ? `Seu período de teste termina em ${daysLeft} dia${daysLeft === 1 ? "" : "s"}.`
            : "Seu período de teste termina hoje."}
        </span>
      </div>
    );
  }

  if (status === "PAST_DUE") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/20 bg-warning/10 px-4 py-2.5 text-[13.5px] sm:px-6">
        <span className="flex items-center gap-2 font-medium text-warning">
          <AlertTriangle className="size-4 shrink-0" />
          Seu período de teste terminou. Fale com o suporte para continuar utilizando o sistema.
        </span>
      </div>
    );
  }

  if (status === "SUSPENDED") {
    return (
      <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-4 py-2.5 text-[13.5px] font-medium text-destructive sm:px-6">
        <AlertTriangle className="size-4 shrink-0" />
        Empresa suspensa. Regularize sua assinatura para voltar a operar.
      </div>
    );
  }

  return null;
}

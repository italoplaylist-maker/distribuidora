import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { Alert, AlertLevel } from "@/features/dashboard/insights";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<AlertLevel, { icon: typeof AlertTriangle; classes: string }> = {
  critical: { icon: AlertTriangle, classes: "bg-destructive/10 text-destructive" },
  warning: { icon: AlertTriangle, classes: "bg-warning/12 text-warning" },
  success: { icon: CheckCircle2, classes: "bg-success/12 text-success" },
  info: { icon: Info, classes: "bg-primary/10 text-primary" },
};

export function AlertsCard({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => {
        const { icon: Icon, classes } = LEVEL_STYLES[alert.level];
        const content = (
          <div className={cn("flex items-start gap-2.5 rounded-lg border border-border/60 p-3", alert.href && "transition-colors hover:border-primary/25")}>
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", classes)}>
              <Icon className="size-4" />
            </span>
            <p className="text-[13px] leading-snug">{alert.message}</p>
          </div>
        );
        return alert.href ? (
          <Link key={alert.id} href={alert.href}>
            {content}
          </Link>
        ) : (
          <div key={alert.id}>{content}</div>
        );
      })}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export interface ActivityItem {
  id: string;
  icon: LucideIcon;
  tone: "primary" | "success" | "warning" | "destructive" | "neutral";
  title: string;
  subtitle: string;
  amount?: number;
  amountTone?: "positive" | "negative";
  time: string;
}

const TONE_CLASSES: Record<ActivityItem["tone"], string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/14 text-warning",
  destructive: "bg-destructive/12 text-destructive",
  neutral: "bg-secondary text-muted-foreground",
};

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma atividade recente.</p>;
  }

  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", TONE_CLASSES[item.tone])}>
            <item.icon className="size-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium leading-tight">{item.title}</p>
            <p className="truncate text-[13px] text-muted-foreground">{item.subtitle}</p>
          </div>
          <div className="shrink-0 text-right">
            {item.amount !== undefined && (
              <p className={cn("text-[14px] font-medium", item.amountTone === "negative" ? "text-destructive" : "text-foreground")}>
                {item.amountTone === "negative" ? "-" : ""}
                {formatCurrency(item.amount)}
              </p>
            )}
            <p className="text-[12px] text-muted-foreground">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

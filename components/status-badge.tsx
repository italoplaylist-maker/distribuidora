import { Badge } from "@/components/ui/badge";
import type { StatusInfo } from "@/lib/status";

const TONE_TO_VARIANT = {
  default: "default",
  success: "success",
  warning: "warning",
  destructive: "destructive",
  info: "info",
  neutral: "neutral",
} as const;

export function StatusBadge({ label, tone, className }: StatusInfo & { className?: string }) {
  return (
    <Badge variant={TONE_TO_VARIANT[tone]} className={className}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

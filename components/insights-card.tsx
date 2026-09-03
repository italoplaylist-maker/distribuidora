import { Sparkles } from "lucide-react";

export function InsightsCard({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2.5">
      {insights.map((text, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13px] leading-snug text-foreground">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

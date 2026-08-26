import { formatCurrency } from "@/lib/utils";

export interface RankingItem {
  label: string;
  value: number;
}

export function RankingList({ items }: { items: RankingItem[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sem dados para o período.</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="flex flex-col gap-3.5">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-[13px] font-semibold tabular-nums text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[13.5px] font-medium">{item.label}</p>
              <p className="shrink-0 text-[13px] font-semibold tabular-nums">{formatCurrency(item.value)}</p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

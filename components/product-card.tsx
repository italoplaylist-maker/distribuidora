import Link from "next/link";
import { Package } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { stockLevelStatus } from "@/lib/status";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  brand?: string | null;
  category?: string | null;
  photoUrl?: string | null;
  stock: number;
  unit: string;
  price: number;
  minStock: number;
}

export function ProductCard({ id, name, brand, category, photoUrl, stock, unit, price, minStock }: ProductCardProps) {
  const status = stockLevelStatus(stock, minStock);

  return (
    <Link
      href={`/dashboard/products/${id}`}
      className="flex items-center gap-3.5 rounded-lg border border-border/60 bg-card p-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/25"
    >
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-secondary">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={name} className="size-full object-cover" />
        ) : (
          <Package className="size-6 text-muted-foreground/60" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-medium leading-tight">{name}</p>
        <p className="truncate text-[12.5px] text-muted-foreground">{[brand, category].filter(Boolean).join(" · ") || unit}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={cn("text-[12.5px]", status ? "font-medium text-warning" : "text-muted-foreground")}>
            {stock.toString()} {unit} em estoque
          </span>
          {status && <StatusBadge {...status} className="py-0 text-[10.5px]" />}
        </div>
      </div>
      <p className="shrink-0 text-[15px] font-semibold tabular-nums">{formatCurrency(price)}</p>
    </Link>
  );
}

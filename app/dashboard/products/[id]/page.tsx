import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Receipt, PackagePlus, History, SlidersHorizontal, Package } from "lucide-react";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { getProductOrThrow, getProductStockHistory } from "@/features/products/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { stockLevelStatus, STOCK_MOVEMENT_LABELS } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StockAdjustSheet } from "@/features/products/stock-adjust-sheet";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let product;
  try {
    product = await getProductOrThrow(tenant.companyId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const movements = await getProductStockHistory(tenant.companyId, id);
  const status = stockLevelStatus(Number(product.stock), Number(product.minStock));
  const unitsSold = movements.filter((m) => m.type === "VENDA").reduce((sum, m) => sum + Math.abs(Number(m.quantity)), 0);
  const margin = product.price.toNumber() > 0 ? ((product.price.toNumber() - product.averageCost.toNumber()) / product.price.toNumber()) * 100 : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary sm:size-20">
          {product.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.photoUrl} alt={product.name} className="size-full object-cover" />
          ) : (
            <Package className="size-8 text-muted-foreground/60" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.01em] sm:text-[24px]">{product.name}</h1>
              <p className="text-[13px] text-muted-foreground">
                {product.category?.name ?? "Sem categoria"} · {product.brand?.name ?? "Sem marca"} · SKU {product.sku ?? "-"}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/products/${id}/edit`}>
                <Pencil className="size-3.5" /> Editar
              </Link>
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-[22px] font-semibold tracking-[-0.01em]">{formatCurrency(product.price.toString())}</p>
            {status ? <StatusBadge {...status} /> : <StatusBadge label="Em estoque" tone="success" />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        <QuickAction href={`/dashboard/sales/new?productId=${id}`} icon={<Receipt />} label="Vender" />
        <QuickAction href={`/dashboard/purchases/new?productId=${id}`} icon={<PackagePlus />} label="Entrada" />
        <StockAdjustSheet
          productId={id}
          currentStock={product.stock.toString()}
          unit={product.unit}
          trigger={
            <button className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card py-3.5 text-center shadow-[var(--shadow-card)] transition-colors hover:border-primary/30 hover:bg-primary/5">
              <SlidersHorizontal className="size-[18px] text-primary" />
              <span className="text-[12px] font-medium">Ajustar</span>
            </button>
          }
        />
        <QuickAction href="#historico" icon={<History />} label="Histórico" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Estoque atual" value={`${product.stock.toString()} ${product.unit}`} />
        <Stat label="Custo médio" value={formatCurrency(product.averageCost.toString())} />
        <Stat label="Margem" value={margin !== null ? `${margin.toFixed(1)}%` : "-"} />
        <Stat label="Unidades vendidas" value={unitsSold.toString()} />
      </div>

      <Card id="historico">
        <CardContent className="pt-6">
          <p className="mb-3 font-semibold tracking-[-0.01em]">Histórico de movimentações</p>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 text-[13.5px]">
                  <div>
                    <p className="font-medium">{STOCK_MOVEMENT_LABELS[m.type] ?? m.type}</p>
                    <p className="text-[12.5px] text-muted-foreground">
                      {formatDate(m.createdAt)} {m.reason ? `· ${m.reason}` : ""}
                    </p>
                  </div>
                  <p className={Number(m.quantity) < 0 ? "font-semibold text-destructive" : "font-semibold text-success"}>
                    {Number(m.quantity) > 0 ? "+" : ""}
                    {m.quantity.toString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card py-3.5 text-center shadow-[var(--shadow-card)] transition-colors hover:border-primary/30 hover:bg-primary/5 [&_svg]:size-[18px] [&_svg]:text-primary"
    >
      {icon}
      <span className="text-[12px] font-medium">{label}</span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-[12px] text-muted-foreground">{label}</p>
        <p className="text-[17px] font-semibold tracking-[-0.01em]">{value}</p>
      </CardContent>
    </Card>
  );
}

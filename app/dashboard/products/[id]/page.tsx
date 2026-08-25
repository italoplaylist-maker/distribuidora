import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Receipt, PackagePlus, History } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { getProductOrThrow, getProductStockHistory } from "@/features/products/queries";
import { NotFoundError } from "@/lib/tenant/tenant-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StockAdjustSheet } from "@/features/products/stock-adjust-sheet";

const MOVEMENT_LABELS: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  VENDA: "Venda",
  COMPRA: "Compra",
  AJUSTE: "Ajuste",
  INVENTARIO: "Inventário",
  PERDA: "Perda",
  AVARIA: "Avaria",
  DEVOLUCAO: "Devolução",
};

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
  const low = Number(product.stock) <= Number(product.minStock);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{product.name}</h1>
          <p className="text-sm text-muted-foreground">
            {product.category?.name ?? "Sem categoria"} · {product.brand?.name ?? "Sem marca"} · SKU {product.sku ?? "-"}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/products/${id}/edit`}>
            <Pencil className="size-4" /> Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4">
          <Link href={`/dashboard/sales/new?productId=${id}`}>
            <Receipt className="size-5 text-primary" /> Vender
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4">
          <Link href={`/dashboard/purchases/new?productId=${id}`}>
            <PackagePlus className="size-5 text-primary" /> Entrada
          </Link>
        </Button>
        <div className="h-auto">
          <StockAdjustSheet productId={id} currentStock={product.stock.toString()} unit={product.unit} />
        </div>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
          <a href="#historico">
            <History className="size-5 text-primary" /> Histórico
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Estoque atual</p>
            <p className="text-lg font-bold">
              {product.stock.toString()} {product.unit}
            </p>
            {low && <Badge variant="warning" className="mt-1">Estoque baixo</Badge>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Preço de venda</p>
            <p className="text-lg font-bold">{formatCurrency(product.price.toString())}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Custo médio</p>
            <p className="text-lg font-bold">{formatCurrency(product.averageCost.toString())}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Margem</p>
            <p className="text-lg font-bold">
              {product.price.toNumber() > 0
                ? `${(((product.price.toNumber() - product.averageCost.toNumber()) / product.price.toNumber()) * 100).toFixed(1)}%`
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card id="historico">
        <CardContent className="pt-5">
          <p className="mb-3 font-semibold">Histórico de movimentações</p>
          {movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="divide-y divide-border">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{MOVEMENT_LABELS[m.type] ?? m.type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)} {m.reason ? `· ${m.reason}` : ""}</p>
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

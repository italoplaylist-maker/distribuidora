import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ShoppingCart, History } from "lucide-react";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { getSupplierOrThrow, getSupplierPurchaseHistory } from "@/features/suppliers/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let supplier;
  try {
    supplier = await getSupplierOrThrow(tenant.companyId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const purchases = await getSupplierPurchaseHistory(tenant.companyId, id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">{supplier.phone ?? "Sem telefone"} · {supplier.email ?? "Sem e-mail"}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/suppliers/${id}/edit`}>
            <Pencil className="size-4" /> Editar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4">
          <Link href={`/dashboard/purchases/new?supplierId=${id}`}>
            <ShoppingCart className="size-5 text-primary" /> Nova compra
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
          <a href="#historico">
            <History className="size-5 text-primary" /> Histórico
          </a>
        </Button>
      </div>

      <Card id="historico">
        <CardContent className="pt-5">
          <p className="mb-3 font-semibold">Últimas compras</p>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma compra registrada.</p>
          ) : (
            <div className="divide-y divide-border">
              {purchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium">{formatDate(p.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">{p.paymentTerm === "CASH" ? "À vista" : "A prazo"}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(p.totalAmount.toString())}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { PackagePlus, Boxes } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listProducts } from "@/features/products/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency } from "@/lib/utils";
import { ProductsSearch } from "@/features/products/products-search";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter } = await searchParams;
  const tenant = await getCurrentTenant();
  const products = await listProducts(tenant.companyId, { search: q, lowStock: filter === "low-stock" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produtos cadastrados</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <PackagePlus className="size-4" /> Novo produto
          </Link>
        </Button>
      </div>

      <ProductsSearch defaultValue={q} lowStockActive={filter === "low-stock"} />

      {products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nenhum produto encontrado"
          description="Cadastre seu primeiro produto para começar a vender."
          actionLabel="Novo produto"
          actionHref="/dashboard/products/new"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead>Preço</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const low = Number(p.stock) <= Number(p.minStock);
              return (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/dashboard/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sku ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.category?.name ?? "-"}</TableCell>
                  <TableCell>
                    <span className={low ? "font-medium text-warning" : ""}>{p.stock.toString()}</span>
                    {low && (
                      <Badge variant="warning" className="ml-2">
                        Baixo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.price.toString())}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

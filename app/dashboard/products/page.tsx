import Link from "next/link";
import { PackagePlus, Boxes } from "lucide-react";
import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listProducts } from "@/features/products/queries";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProductCard } from "@/components/product-card";
import { StatusBadge } from "@/components/status-badge";
import { stockLevelStatus } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";
import { ProductsSearch } from "@/features/products/products-search";
import { Pagination } from "@/components/pagination";

const FILTER_MAP: Record<string, "low" | "zero" | "recent" | undefined> = {
  "low-stock": "low",
  "zero-stock": "zero",
  recent: "recent",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  const { q, filter, page } = await searchParams;
  const tenant = await getCurrentTenant();
  const currentPage = Math.max(1, Number(page) || 1);
  const result = await listProducts(tenant.companyId, { search: q, stockFilter: filter ? FILTER_MAP[filter] : undefined }, currentPage);
  const products = result.items;

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter) params.set("filter", filter);
    params.set("page", String(p));
    return `/dashboard/products?${params.toString()}`;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Produtos"
        description={`${result.total} produto${result.total === 1 ? "" : "s"} cadastrado${result.total === 1 ? "" : "s"}`}
        action={
          <Button asChild>
            <Link href="/dashboard/products/new">
              <PackagePlus className="size-4" /> Novo produto
            </Link>
          </Button>
        }
      />

      <ProductsSearch defaultValue={q} activeFilter={filter} />

      {products.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nenhum produto encontrado"
          description="Cadastre seu primeiro produto para começar a vender."
          actionLabel="Novo produto"
          actionHref="/dashboard/products/new"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2.5 lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                brand={p.brand?.name}
                category={p.category?.name}
                photoUrl={p.photoUrl}
                stock={Number(p.stock)}
                unit={p.unit}
                price={p.price.toNumber()}
                minStock={Number(p.minStock)}
              />
            ))}
          </div>

          <div className="hidden lg:block">
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
                  const status = stockLevelStatus(Number(p.stock), Number(p.minStock));
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
                        <div className="flex items-center gap-2">
                          <span className={status ? "font-medium text-warning" : ""}>{p.stock.toString()}</span>
                          {status && <StatusBadge {...status} />}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.price.toString())}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Pagination page={result.page} totalPages={result.totalPages} hrefFor={pageHref} />
        </>
      )}
    </div>
  );
}

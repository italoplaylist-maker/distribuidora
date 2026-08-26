import { notFound } from "next/navigation";
import { getCurrentTenant, NotFoundError } from "@/lib/tenant/tenant-context";
import { getProductOrThrow, listCategories, listBrands } from "@/features/products/queries";
import { ProductForm } from "@/features/products/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getCurrentTenant();

  let product;
  try {
    product = await getProductOrThrow(tenant.companyId, id);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const [categories, brands] = await Promise.all([listCategories(tenant.companyId), listBrands(tenant.companyId)]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Editar produto" />
      <Card>
        <CardContent className="pt-6">
          <ProductForm
            categories={categories}
            brands={brands}
            product={{
              id: product.id,
              name: product.name,
              sku: product.sku ?? undefined,
              barcode: product.barcode ?? undefined,
              categoryId: product.categoryId ?? undefined,
              brandId: product.brandId ?? undefined,
              unit: product.unit,
              cost: product.cost.toNumber(),
              price: product.price.toNumber(),
              stock: product.stock.toNumber(),
              minStock: product.minStock.toNumber(),
              maxStock: product.maxStock.toNumber(),
              active: product.active,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

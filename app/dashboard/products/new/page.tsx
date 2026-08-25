import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listCategories, listBrands } from "@/features/products/queries";
import { ProductForm } from "@/features/products/product-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewProductPage() {
  const tenant = await getCurrentTenant();
  const [categories, brands] = await Promise.all([listCategories(tenant.companyId), listBrands(tenant.companyId)]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Novo produto</h1>
      <Card>
        <CardContent className="pt-5">
          <ProductForm categories={categories} brands={brands} />
        </CardContent>
      </Card>
    </div>
  );
}

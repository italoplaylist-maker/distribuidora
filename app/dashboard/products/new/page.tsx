import { getCurrentTenant } from "@/lib/tenant/tenant-context";
import { listCategories, listBrands } from "@/features/products/queries";
import { ProductForm } from "@/features/products/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export default async function NewProductPage() {
  const tenant = await getCurrentTenant();
  const [categories, brands] = await Promise.all([listCategories(tenant.companyId), listBrands(tenant.companyId)]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Novo produto" />
      <Card>
        <CardContent className="pt-6">
          <ProductForm categories={categories} brands={brands} />
        </CardContent>
      </Card>
    </div>
  );
}

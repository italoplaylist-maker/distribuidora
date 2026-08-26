import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Informe o nome do produto"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  unit: z.string().min(1).default("UN"),
  cost: z.coerce.number().min(0),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(0),
  maxStock: z.coerce.number().min(0).default(0),
  photoUrl: z.string().max(2_000_000, "Imagem muito grande").optional().nullable(),
  active: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;

export const stockAdjustSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().refine((v) => v !== 0, "Informe uma quantidade diferente de zero"),
  reason: z.string().min(3, "Informe o motivo do ajuste"),
});
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;

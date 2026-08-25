import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
});

export const saleSchema = z.object({
  customerId: z.string().optional(),
  paymentMethod: z.enum(["cash", "pix", "debit", "credit", "fiado"]),
  discount: z.coerce.number().min(0).default(0),
  items: z.array(saleItemSchema).min(1, "Adicione ao menos um item"),
});
export type SaleInput = z.infer<typeof saleSchema>;

export const cancelSaleSchema = z.object({
  saleId: z.string().min(1),
  reason: z.string().min(3, "Informe o motivo do cancelamento"),
});
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>;

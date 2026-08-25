import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive("Quantidade deve ser maior que zero"),
  unitCost: z.coerce.number().min(0),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecione um fornecedor"),
  paymentTerm: z.enum(["CASH", "CREDIT"]),
  items: z.array(purchaseItemSchema).min(1, "Adicione ao menos um item"),
  notes: z.string().optional(),
});
export type PurchaseInput = z.infer<typeof purchaseSchema>;

export const cancelPurchaseSchema = z.object({
  purchaseId: z.string().min(1),
  reason: z.string().min(3, "Informe o motivo do cancelamento"),
});
export type CancelPurchaseInput = z.infer<typeof cancelPurchaseSchema>;

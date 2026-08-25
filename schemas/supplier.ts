import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(2, "Informe o nome do fornecedor"),
  document: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  active: z.boolean().default(true),
});
export type SupplierInput = z.infer<typeof supplierSchema>;

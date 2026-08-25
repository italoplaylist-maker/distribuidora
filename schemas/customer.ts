import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente"),
  document: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  creditLimit: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});
export type CustomerInput = z.infer<typeof customerSchema>;

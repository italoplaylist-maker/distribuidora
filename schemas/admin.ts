import { z } from "zod";

export const planSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.coerce.number().min(0),
  priceYearly: z.coerce.number().min(0),
  maxUsers: z.coerce.number(),
  maxProducts: z.coerce.number(),
  maxCustomers: z.coerce.number(),
  maxSuppliers: z.coerce.number(),
  maxStorageMb: z.coerce.number(),
  features: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});
export type PlanInput = z.infer<typeof planSchema>;

export const deleteCompanySchema = z.object({
  companyId: z.string().min(1),
  password: z.string().min(1, "Confirme sua senha"),
  reason: z.string().min(5, "Informe o motivo da exclusão"),
});
export type DeleteCompanyInput = z.infer<typeof deleteCompanySchema>;

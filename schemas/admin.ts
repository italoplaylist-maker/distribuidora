import { z } from "zod";

export const deleteCompanySchema = z.object({
  companyId: z.string().min(1),
  password: z.string().min(1, "Confirme sua senha"),
  reason: z.string().min(5, "Informe o motivo da exclusão"),
});
export type DeleteCompanyInput = z.infer<typeof deleteCompanySchema>;

export const createCompanySchema = z.object({
  razaoSocial: z.string().min(2, "Informe a razão social"),
  nomeFantasia: z.string().min(2, "Informe o nome fantasia"),
  cnpj: z
    .string()
    .min(14, "CNPJ inválido")
    .transform((v) => v.replace(/\D/g, "")),
  companyEmail: z.string().email("E-mail da empresa inválido"),
  phone: z.string().optional(),
  status: z.enum(["TRIAL", "ACTIVE"]).default("TRIAL"),
  trialDays: z.coerce.number().min(1).max(90).default(3),
  adminName: z.string().min(2, "Informe o nome do responsável"),
  adminEmail: z.string().email("E-mail inválido"),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = z.object({
  razaoSocial: z.string().min(2, "Informe a razão social"),
  nomeFantasia: z.string().min(2, "Informe o nome fantasia"),
  cnpj: z
    .string()
    .min(14, "CNPJ inválido")
    .transform((v) => v.replace(/\D/g, "")),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export const changeAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type ChangeAdminPasswordInput = z.infer<typeof changeAdminPasswordSchema>;

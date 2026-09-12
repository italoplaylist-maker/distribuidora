import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  role: z.enum(["ADMINISTRADOR", "GERENTE", "VENDEDOR", "ESTOQUISTA", "FINANCEIRO", "MOTORISTA"]),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const companySchema = z.object({
  razaoSocial: z.string().min(2),
  nomeFantasia: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
export type CompanyProfileInput = z.infer<typeof companySchema>;

export const changeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual"),
    newPassword: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordSchema>;

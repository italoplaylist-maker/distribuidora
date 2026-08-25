import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  razaoSocial: z.string().min(2, "Informe a razão social"),
  nomeFantasia: z.string().min(2, "Informe o nome fantasia"),
  cnpj: z
    .string()
    .min(14, "CNPJ inválido")
    .transform((v) => v.replace(/\D/g, "")),
  companyEmail: z.string().email("E-mail da empresa inválido"),
  phone: z.string().optional(),
  planId: z.string().min(1, "Selecione um plano"),
  adminName: z.string().min(2, "Informe seu nome"),
  adminEmail: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
});
export type SignupInput = z.infer<typeof signupSchema>;

import { z } from "zod";

export const paymentSchema = z.object({
  id: z.string().min(1),
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
});
export type PaymentInput = z.infer<typeof paymentSchema>;

export const openCashRegisterSchema = z.object({
  openingBalance: z.coerce.number().min(0),
});
export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;

export const closeCashRegisterSchema = z.object({
  cashRegisterId: z.string().min(1),
  informedBalance: z.coerce.number().min(0),
});
export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;

export const cashMovementSchema = z.object({
  type: z.enum(["SANGRIA", "SUPRIMENTO"]),
  amount: z.coerce.number().positive("Informe um valor maior que zero"),
  description: z.string().min(2, "Informe uma descrição"),
});
export type CashMovementInput = z.infer<typeof cashMovementSchema>;

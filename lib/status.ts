import { startOfDayBrazil } from "@/lib/timezone";

export type BadgeTone = "default" | "success" | "warning" | "destructive" | "info" | "neutral";

export interface StatusInfo {
  label: string;
  tone: BadgeTone;
}

// Single source of truth for how each domain's status enum reads on screen.
// Kept server-safe (no client-only imports) so both server components and
// server actions can share it; the presentational <StatusBadge> is client-free too.

export function saleStatus(status: string): StatusInfo {
  return status === "CANCELED" ? { label: "Cancelada", tone: "neutral" } : { label: "Concluída", tone: "success" };
}

export function purchaseStatus(status: string): StatusInfo {
  return status === "CANCELED" ? { label: "Cancelada", tone: "neutral" } : { label: "Recebida", tone: "success" };
}

export function accountStatus(status: string, dueDate: Date | string): StatusInfo {
  // Compared against the start of today in Brazil, not the raw current instant — otherwise
  // something due "today" would flip to "Vencida" hours early/late depending on server timezone.
  const overdue = (status === "OPEN" || status === "PARTIALLY_PAID") && new Date(dueDate) < startOfDayBrazil();
  if (overdue) return { label: "Vencida", tone: "destructive" };
  switch (status) {
    case "PAID":
      return { label: "Pago", tone: "success" };
    case "PARTIALLY_PAID":
      return { label: "Parcial", tone: "warning" };
    case "CANCELED":
      return { label: "Cancelada", tone: "neutral" };
    default:
      return { label: "Em aberto", tone: "warning" };
  }
}

export function deliveryStatus(status: string): StatusInfo {
  switch (status) {
    case "DELIVERED":
      return { label: "Entregue", tone: "success" };
    case "IN_ROUTE":
      return { label: "Em rota", tone: "info" };
    case "FAILED":
      return { label: "Falhou", tone: "destructive" };
    case "CANCELED":
      return { label: "Cancelada", tone: "neutral" };
    default:
      return { label: "Pendente", tone: "warning" };
  }
}

export function companyStatus(status: string): StatusInfo {
  switch (status) {
    case "ACTIVE":
      return { label: "Ativa", tone: "success" };
    case "TRIAL":
      return { label: "Trial", tone: "warning" };
    case "PAST_DUE":
      return { label: "Inadimplente", tone: "warning" };
    case "SUSPENDED":
      return { label: "Suspensa", tone: "destructive" };
    default:
      return { label: "Cancelada", tone: "neutral" };
  }
}

export function subscriptionStatus(status: string): StatusInfo {
  switch (status) {
    case "ACTIVE":
      return { label: "Ativa", tone: "success" };
    case "TRIALING":
      return { label: "Trial", tone: "warning" };
    case "PAST_DUE":
      return { label: "Inadimplente", tone: "warning" };
    default:
      return { label: "Cancelada", tone: "neutral" };
  }
}

export function stockLevelStatus(stock: number, minStock: number): StatusInfo | null {
  if (stock <= 0) return { label: "Zerado", tone: "destructive" };
  if (stock <= minStock) return { label: "Baixo", tone: "warning" };
  return null;
}

export function userStatus(active: boolean): StatusInfo {
  return active ? { label: "Ativo", tone: "success" } : { label: "Inativo", tone: "neutral" };
}

export function planStatus(active: boolean): StatusInfo {
  return active ? { label: "Ativo", tone: "success" } : { label: "Inativo", tone: "neutral" };
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
  fiado: "Fiado",
};

export const STOCK_MOVEMENT_LABELS: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  VENDA: "Venda",
  COMPRA: "Compra",
  AJUSTE: "Ajuste",
  INVENTARIO: "Inventário",
  PERDA: "Perda",
  AVARIA: "Avaria",
  DEVOLUCAO: "Devolução",
};

export const CASH_MOVEMENT_LABELS: Record<string, string> = {
  ABERTURA: "Abertura",
  VENDA: "Venda",
  RECEBIMENTO: "Recebimento",
  DESPESA: "Despesa",
  SANGRIA: "Sangria",
  SUPRIMENTO: "Suprimento",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  GERENTE: "Gerente",
  VENDEDOR: "Vendedor",
  ESTOQUISTA: "Estoquista",
  FINANCEIRO: "Financeiro",
  MOTORISTA: "Motorista",
};

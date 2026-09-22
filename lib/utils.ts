import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatBrazilDateTime } from "@/lib/timezone";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num || 0);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatBrazilDateTime(d);
}

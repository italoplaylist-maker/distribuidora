import { formatCurrency } from "@/lib/utils";

export type AlertLevel = "critical" | "warning" | "success" | "info";

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  href?: string;
}

interface DashboardDataForAlerts {
  lowStockItems: { id: string; name: string; stock: string; minStock: string }[];
  overdueReceivablesCount: number;
  overdueReceivablesTotal: number;
  overduePayablesCount: number;
  overduePayablesTotal: number;
  margemMedia: number | null;
  saldoCaixa: number | null;
  contasPagar: number;
  faturamentoMes: number;
}

/**
 * Alerts are derived only from real, already-computed dashboard figures —
 * nothing here is estimated or invented.
 */
export function buildAlerts(data: DashboardDataForAlerts): Alert[] {
  const alerts: Alert[] = [];

  const zeroStock = data.lowStockItems.filter((p) => Number(p.stock) <= 0);
  const lowStock = data.lowStockItems.filter((p) => Number(p.stock) > 0);

  if (zeroStock.length > 0) {
    alerts.push({
      id: "stock-zero",
      level: "critical",
      message: `${zeroStock.length} produto${zeroStock.length > 1 ? "s" : ""} zerado${zeroStock.length > 1 ? "s" : ""}: ${zeroStock.slice(0, 3).map((p) => p.name).join(", ")}${zeroStock.length > 3 ? "..." : ""}.`,
      href: "/dashboard/products?filter=zero",
    });
  }
  if (lowStock.length > 0) {
    alerts.push({
      id: "stock-low",
      level: "warning",
      message: `${lowStock.length} produto${lowStock.length > 1 ? "s" : ""} abaixo do estoque mínimo.`,
      href: "/dashboard/products?filter=low",
    });
  }

  if (data.overdueReceivablesCount > 0) {
    alerts.push({
      id: "receivables-overdue",
      level: "critical",
      message: `Você tem ${formatCurrency(data.overdueReceivablesTotal)} em contas a receber vencidas (${data.overdueReceivablesCount}).`,
      href: "/dashboard/finance/receivables",
    });
  }
  if (data.overduePayablesCount > 0) {
    alerts.push({
      id: "payables-overdue",
      level: "critical",
      message: `Você tem ${formatCurrency(data.overduePayablesTotal)} em contas a pagar vencidas (${data.overduePayablesCount}).`,
      href: "/dashboard/finance/payables",
    });
  }

  if (data.margemMedia !== null && data.margemMedia < 15 && data.faturamentoMes > 0) {
    alerts.push({
      id: "margin-low",
      level: "warning",
      message: `Sua margem média nos últimos 30 dias está em ${data.margemMedia.toFixed(1)}%, considerada baixa.`,
      href: "/dashboard/reports",
    });
  }

  if (data.saldoCaixa !== null && data.saldoCaixa < 0) {
    alerts.push({ id: "cash-negative", level: "critical", message: "O saldo do caixa aberto está negativo.", href: "/dashboard/finance/cash" });
  }

  if (data.saldoCaixa !== null && data.contasPagar > data.saldoCaixa && data.contasPagar > 0) {
    alerts.push({
      id: "liquidity-low",
      level: "warning",
      message: "O caixa disponível não cobre suas contas a pagar em aberto.",
      href: "/dashboard/finance/liquidity",
    });
  }

  if (alerts.length === 0) {
    alerts.push({ id: "all-good", level: "success", message: "Nenhum alerta no momento. Tudo sob controle." });
  }

  return alerts;
}

interface DashboardDataForInsights {
  faturamentoMes: number;
  faturamentoHoje: number;
  variacaoVendas: number | null;
  estoqueValor: number;
  estoquePotencial: number;
  lucroPotencialEstoque: number;
  lowStockItems: unknown[];
  overdueReceivablesTotal: number;
  topProducts: { label: string; value: number }[];
}

/** Plain, factual sentences generated from real dashboard data — never fabricated. */
export function buildInsights(data: DashboardDataForInsights): string[] {
  const insights: string[] = [];

  if (data.variacaoVendas !== null) {
    const dir = data.variacaoVendas >= 0 ? "aumentou" : "caiu";
    insights.push(`Seu faturamento de hoje ${dir} ${Math.abs(data.variacaoVendas).toFixed(0)}% em relação a ontem.`);
  }

  if (data.topProducts.length > 0 && data.faturamentoMes > 0) {
    const top = data.topProducts[0];
    const share = (top.value / data.faturamentoMes) * 100;
    insights.push(`O produto "${top.label}" representa ${share.toFixed(0)}% do seu faturamento nos últimos 30 dias.`);
  }

  insights.push(`Você possui ${formatCurrency(data.estoqueValor)} investidos em estoque.`);
  insights.push(`Seu estoque possui ${formatCurrency(data.estoquePotencial)} em valor potencial de venda.`);
  insights.push(`Seu lucro potencial atual, se vender todo o estoque, é de ${formatCurrency(data.lucroPotencialEstoque)}.`);

  if (data.lowStockItems.length > 0) {
    insights.push(`${data.lowStockItems.length} produto${data.lowStockItems.length > 1 ? "s estão" : " está"} no estoque mínimo ou abaixo dele.`);
  }

  if (data.overdueReceivablesTotal > 0) {
    insights.push(`Você possui ${formatCurrency(data.overdueReceivablesTotal)} em contas a receber vencidas.`);
  }

  return insights;
}

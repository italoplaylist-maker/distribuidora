"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface ProfitabilityPoint {
  label: string;
  faturamento: number;
  custo: number;
  lucroBruto: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ProfitabilityPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="space-y-1 rounded-md border border-border/60 bg-elevated px-3 py-2 shadow-[var(--shadow-elevated)]">
      <p className="text-[11px] capitalize text-muted-foreground">{point.label}</p>
      <p className="text-[13px] font-medium text-primary">Faturamento: {formatCurrency(point.faturamento)}</p>
      <p className="text-[13px] font-medium text-muted-foreground">Custo: {formatCurrency(point.custo)}</p>
      <p className="text-[13px] font-medium text-success">Lucro bruto: {formatCurrency(point.lucroBruto)}</p>
    </div>
  );
}

export function ProfitabilityChart({ data }: { data: ProfitabilityPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="faturamentoFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="custoFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--muted-foreground)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--muted-foreground)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          dy={8}
          className="capitalize"
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
        <Area type="monotone" dataKey="faturamento" stroke="var(--primary)" strokeWidth={2} fill="url(#faturamentoFill)" dot={false} animationDuration={500} />
        <Area type="monotone" dataKey="custo" stroke="var(--muted-foreground)" strokeWidth={2} fill="url(#custoFill)" dot={false} animationDuration={500} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

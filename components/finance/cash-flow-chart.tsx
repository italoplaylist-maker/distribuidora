"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface CashFlowPoint {
  label: string;
  entradas: number;
  saidas: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: CashFlowPoint }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="space-y-1 rounded-md border border-border/60 bg-elevated px-3 py-2 shadow-[var(--shadow-elevated)]">
      <p className="text-[11px] text-muted-foreground">{point.label}</p>
      <p className="text-[13px] font-medium text-success">+{formatCurrency(point.entradas)}</p>
      <p className="text-[13px] font-medium text-destructive">-{formatCurrency(point.saidas)}</p>
    </div>
  );
}

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="entradasFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="saidasFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 8" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          dy={8}
          interval="preserveStartEnd"
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
        <Area type="monotone" dataKey="entradas" stroke="var(--success)" strokeWidth={2} fill="url(#entradasFill)" dot={false} animationDuration={500} />
        <Area type="monotone" dataKey="saidas" stroke="var(--destructive)" strokeWidth={2} fill="url(#saidasFill)" dot={false} animationDuration={500} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

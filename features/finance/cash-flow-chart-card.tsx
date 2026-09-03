"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CashFlowChart, type CashFlowPoint } from "@/components/finance/cash-flow-chart";
import { formatCurrency } from "@/lib/utils";

type Period = "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = { "7d": "7 dias", "30d": "30 dias", "90d": "90 dias" };

interface PeriodData {
  points: CashFlowPoint[];
  totalEntradas: number;
  totalSaidas: number;
  saldoPeriodo: number;
}

export function CashFlowChartCard({ data }: { data: Record<Period, PeriodData> }) {
  const [period, setPeriod] = useState<Period>("30d");
  const current = data[period];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-5">
          <div>
            <p className="text-[12px] text-muted-foreground">Entradas</p>
            <p className="text-[15px] font-semibold text-success">{formatCurrency(current.totalEntradas)}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Saídas</p>
            <p className="text-[15px] font-semibold text-destructive">{formatCurrency(current.totalSaidas)}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Saldo do período</p>
            <p className={`text-[15px] font-semibold ${current.saldoPeriodo >= 0 ? "text-foreground" : "text-destructive"}`}>
              {formatCurrency(current.saldoPeriodo)}
            </p>
          </div>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="h-9">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <TabsTrigger key={p} value={p} className="px-3 py-1 text-[12.5px]">
                {PERIOD_LABELS[p]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <CashFlowChart data={current.points} />
    </div>
  );
}

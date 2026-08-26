"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendChart, type TrendPoint } from "@/components/trend-chart";

type Period = "today" | "week" | "month";

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoje",
  week: "7 dias",
  month: "30 dias",
};

export function SalesChartCard({ data }: { data: Record<Period, TrendPoint[]> }) {
  const [period, setPeriod] = useState<Period>("week");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold tracking-[-0.01em]">Vendas</p>
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
      <TrendChart data={data[period]} />
    </div>
  );
}

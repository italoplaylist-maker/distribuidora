"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function PricingHelper({ cost, price, onApplyPrice }: { cost: number; price: number; onApplyPrice: (price: number) => void }) {
  const [desiredMargin, setDesiredMargin] = useState("30");

  const lucroUnitario = price - cost;
  const margin = price > 0 ? (lucroUnitario / price) * 100 : null;

  const marginValue = Number(desiredMargin);
  const suggestedPrice = cost > 0 && marginValue > 0 && marginValue < 100 ? cost / (1 - marginValue / 100) : null;

  return (
    <Card className="bg-secondary/40">
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <Calculator className="size-4 text-primary" /> Precificação
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[12px] text-muted-foreground">Lucro unitário</p>
            <p className={`text-[16px] font-semibold ${lucroUnitario >= 0 ? "" : "text-destructive"}`}>{formatCurrency(lucroUnitario)}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Margem</p>
            <p className={`text-[16px] font-semibold ${margin !== null && margin < 10 ? "text-destructive" : ""}`}>
              {margin !== null ? `${margin.toFixed(1)}%` : "—"}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-border/60 pt-3.5">
          <Label className="text-[12.5px]">Sugerir preço a partir da margem desejada</Label>
          <div className="flex items-center gap-2">
            <div className="relative w-24 shrink-0">
              <Input
                type="number"
                step="1"
                min={0}
                max={99}
                value={desiredMargin}
                onChange={(e) => setDesiredMargin(e.target.value)}
                className="pr-7"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">%</span>
            </div>
            <p className="flex-1 text-[13.5px] text-muted-foreground">
              {suggestedPrice !== null ? (
                <>
                  Preço sugerido: <span className="font-semibold text-foreground">{formatCurrency(suggestedPrice)}</span>
                </>
              ) : (
                "Informe o custo e uma margem entre 1% e 99%."
              )}
            </p>
            <Button type="button" size="sm" variant="outline" disabled={suggestedPrice === null} onClick={() => suggestedPrice !== null && onApplyPrice(Number(suggestedPrice.toFixed(2)))}>
              Aplicar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

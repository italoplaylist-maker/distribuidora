"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Não conseguimos carregar os dados.",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <div className="flex size-13 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="font-medium tracking-[-0.01em]">{title}</p>
        {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-2">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold">Algo deu errado</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Não foi possível carregar esta página. Tente novamente — se o problema continuar, volte mais tarde.
        </p>
      </div>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CloudUpload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listQueuedSales, removeQueuedSale, queuedSalesCount } from "@/lib/offline/sales-queue";
import { createSaleAction } from "@/features/sales/actions";

export function OfflineSyncBanner() {
  const router = useRouter();
  const [count, setCount] = useState<number>(() => queuedSalesCount());
  const [syncing, setSyncing] = useState(false);

  const refreshCount = useCallback(() => setCount(queuedSalesCount()), []);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    const queue = listQueuedSales();
    if (queue.length === 0) return;
    setSyncing(true);
    let synced = 0;
    for (const item of queue) {
      try {
        const result = await createSaleAction(item.payload);
        if (result.success) {
          removeQueuedSale(item.localId);
          synced++;
        }
      } catch {
        // stay queued, will retry on next sync
      }
    }
    setSyncing(false);
    refreshCount();
    if (synced > 0) {
      toast.success(`${synced} venda(s) offline sincronizada(s)`);
      router.refresh();
    }
  }, [refreshCount, router]);

  useEffect(() => {
    window.addEventListener("online", sync);
    window.addEventListener("focus", refreshCount);
    // Deferred so the initial sync (which itself calls setState) never runs
    // synchronously inside the effect body.
    const timer = setTimeout(() => {
      if (navigator.onLine) sync();
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", sync);
      window.removeEventListener("focus", refreshCount);
    };
  }, [sync, refreshCount]);

  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-warning/10 px-4 py-2 text-sm text-warning">
      <span className="flex items-center gap-2">
        <CloudUpload className="size-4" />
        {count} venda{count > 1 ? "s" : ""} salva{count > 1 ? "s" : ""} offline aguardando sincronização.
      </span>
      <Button size="sm" variant="outline" onClick={sync} disabled={syncing}>
        {syncing && <Loader2 className="size-3.5 animate-spin" />}
        Sincronizar agora
      </Button>
    </div>
  );
}

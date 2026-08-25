"use client";

import { useEffect, useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// The BarcodeDetector API isn't in the default DOM lib types yet.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorLike;
  }
}

export function BarcodeScannerButton({ onDetected }: { onDetected: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [supported] = useState<boolean>(() => typeof window !== "undefined" && "BarcodeDetector" in window);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open || !supported) return;

    let cancelled = false;
    let rafId: number;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector!({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"] });

        async function tick() {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              onDetected(codes[0].rawValue);
              setOpen(false);
              return;
            }
          } catch {
            // detection failure on a single frame is expected while focusing; keep trying
          }
          rafId = requestAnimationFrame(tick);
        }
        tick();
      } catch {
        setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      }
    }
    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [open, supported, onDetected]);

  return (
    <>
      <Button type="button" variant="outline" size="icon" onClick={() => setOpen(true)} title="Escanear código de barras">
        <ScanBarcode className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escanear código de barras</DialogTitle>
            <DialogDescription>Aponte a câmera para o código de barras do produto.</DialogDescription>
          </DialogHeader>

          {supported && !error && (
            <video ref={videoRef} className="aspect-video w-full rounded-xl bg-black object-cover" muted playsInline />
          )}

          {(!supported || error) && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {error ?? "Este navegador não suporta leitura automática de código de barras. Digite o código manualmente."}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualCode.trim()) {
                    onDetected(manualCode.trim());
                    setOpen(false);
                    setManualCode("");
                  }
                }}
                className="flex gap-2"
              >
                <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="Código de barras" autoFocus />
                <Button type="submit">Buscar</Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

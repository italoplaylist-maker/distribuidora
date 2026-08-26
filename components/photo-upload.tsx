"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

function compressImage(file: File, maxDim = 720, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUpload({
  value,
  onChange,
  className,
}: {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error("Imagem muito grande (máx. 12MB)");
      return;
    }
    setIsProcessing(true);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch {
      toast.error("Não foi possível processar a imagem");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-secondary">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Foto do produto" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground/60" strokeWidth={1.75} />
        )}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {value && !isProcessing && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-foreground/80 text-background transition-colors hover:bg-destructive"
            aria-label="Remover foto"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={isProcessing}>
          {isProcessing && <Loader2 className="size-3.5 animate-spin" />}
          {value ? "Trocar foto" : "Adicionar foto"}
        </Button>
        <p className="text-[12px] text-muted-foreground">JPG ou PNG, até 12MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onSelect} />
    </div>
  );
}

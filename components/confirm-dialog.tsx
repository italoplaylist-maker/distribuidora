"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from "@/components/responsive-dialog";

interface ConfirmDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  successMessage?: string;
  onConfirm: (reason: string) => Promise<{ success: boolean; error?: string }>;
  onSuccess?: () => void;
}

/** Shared confirmation flow for irreversible actions (cancel sale/purchase, delete, etc). Optionally collects a required reason. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  destructive = true,
  reasonLabel,
  reasonPlaceholder,
  successMessage,
  onConfirm,
  onSuccess,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm(reason);
      if (!result.success) {
        toast.error(result.error ?? "Não foi possível concluir a ação");
        return;
      }
      toast.success(successMessage ?? "Ação concluída");
      setOpen(false);
      setReason("");
      onSuccess?.();
    });
  }

  const needsReason = !!reasonLabel;
  const disabled = isPending || (needsReason && reason.trim().length < 3);

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>{trigger}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {needsReason && (
          <div className="space-y-1.5">
            <Label>{reasonLabel}</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={reasonPlaceholder} autoFocus />
          </div>
        )}
        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Voltar
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={handleConfirm} disabled={disabled}>
            {isPending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

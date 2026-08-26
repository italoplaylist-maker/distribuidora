"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-media-query";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

/**
 * One trigger/content API that renders as a centered Dialog on desktop and
 * a bottom Sheet on mobile — the "modal is automatic" rule from the design
 * spec, so callers never branch on viewport themselves.
 */
export function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const Root = isMobile ? Sheet : Dialog;
  return (
    <Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Root>
  );
}

export function ResponsiveDialogTrigger({ children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useIsMobile();
  const Trigger = isMobile ? SheetTrigger : DialogTrigger;
  return <Trigger {...props}>{children}</Trigger>;
}

export function ResponsiveDialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <SheetContent side="bottom" className={className} {...props}>
        {children}
      </SheetContent>
    );
  }
  return (
    <DialogContent className={cn("sm:max-w-md", className)} {...props}>
      {children}
    </DialogContent>
  );
}

export function ResponsiveDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  const Header = isMobile ? SheetHeader : DialogHeader;
  return <Header className={className}>{children}</Header>;
}

export function ResponsiveDialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  const Title = isMobile ? SheetTitle : DialogTitle;
  return <Title className={className}>{children}</Title>;
}

export function ResponsiveDialogDescription({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const Description = isMobile ? SheetDescription : DialogDescription;
  return <Description>{children}</Description>;
}

export function ResponsiveDialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile();
  if (isMobile) return <div className={cn("mt-2 flex flex-col gap-2", className)}>{children}</div>;
  return <DialogFooter className={className}>{children}</DialogFooter>;
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  label: string;
  hint?: string;
  /** Pass a rendered icon element (e.g. `<Receipt />`) — Server Components can't pass component references as props to a Client Component. */
  icon: ReactNode;
  href: string;
  className?: string;
}

export function ActionCard({ label, hint, icon, href, className }: ActionCardProps) {
  return (
    <Link href={href} className="block shrink-0">
      <motion.div
        whileTap={{ scale: 0.96 }}
        className={cn(
          "flex h-full min-w-[104px] flex-col items-center justify-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-4 text-center shadow-[var(--shadow-card)] transition-colors hover:border-primary/30 hover:bg-primary/5",
          className,
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary [&_svg]:size-5">{icon}</span>
        <div>
          <p className="text-[13px] font-medium leading-tight">{label}</p>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </motion.div>
    </Link>
  );
}

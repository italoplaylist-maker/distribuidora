"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "primary" | "success" | "warning" | "destructive" | "neutral";

const ACCENT_CLASSES: Record<Accent, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/14 text-warning",
  destructive: "bg-destructive/12 text-destructive",
  neutral: "bg-secondary text-muted-foreground",
};

interface MetricCardProps {
  label: string;
  value: string;
  /** Pass a rendered icon element (e.g. `<Receipt />`) — Server Components can't pass component references as props to a Client Component. */
  icon: React.ReactNode;
  accent?: Accent;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" };
  href?: string;
  index?: number;
}

export function MetricCard({ label, value, icon, accent = "primary", hint, trend, href, index = 0 }: MetricCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] transition-shadow",
        href && "cursor-pointer hover:shadow-[var(--shadow-elevated)]",
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("flex size-10 items-center justify-center rounded-md [&_svg]:size-5", ACCENT_CLASSES[accent])}>
          {icon}
        </span>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-medium",
              trend.direction === "up" ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive",
            )}
          >
            {trend.direction === "up" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {trend.value}
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        <p className="text-[13px] text-muted-foreground">{label}</p>
        <p className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">{value}</p>
        {hint && <p className="text-[12.5px] text-muted-foreground">{hint}</p>}
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

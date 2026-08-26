import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium leading-none",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        neutral: "bg-secondary text-muted-foreground",
        secondary: "bg-secondary text-muted-foreground",
        success: "bg-success/12 text-success",
        warning: "bg-warning/14 text-warning",
        destructive: "bg-destructive/12 text-destructive",
        info: "bg-info/12 text-info",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

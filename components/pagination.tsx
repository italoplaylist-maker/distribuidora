import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({ page, totalPages, hrefFor, className }: { page: number; totalPages: number; hrefFor: (page: number) => string; className?: string }) {
  if (totalPages <= 1) return null;

  const linkClass = cn(buttonVariants({ variant: "outline", size: "sm" }));
  const disabledClass = cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-none opacity-40");

  return (
    <div className={cn("flex items-center justify-between gap-3 pt-1", className)}>
      <p className="text-[12.5px] text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={linkClass}>
            <ChevronLeft className="size-4" /> Anterior
          </Link>
        ) : (
          <span className={disabledClass}>
            <ChevronLeft className="size-4" /> Anterior
          </span>
        )}
        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} className={linkClass}>
            Próxima <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className={disabledClass}>
            Próxima <ChevronRight className="size-4" />
          </span>
        )}
      </div>
    </div>
  );
}

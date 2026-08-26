import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-md bg-secondary", className)}
      {...props}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite]"
        style={{
          background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--foreground) 6%, transparent), transparent)",
        }}
      />
    </div>
  );
}

export { Skeleton };

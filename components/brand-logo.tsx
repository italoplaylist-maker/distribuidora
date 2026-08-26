import Image from "next/image";
import logo from "@/public/logo.jpg";
import { cn } from "@/lib/utils";

export function BrandLogo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <Image
      src={logo}
      alt="Distribuidora SaaS"
      width={size}
      height={size}
      className={cn("shrink-0 rounded-lg object-cover shadow-[var(--shadow-xs)]", className)}
      priority
    />
  );
}

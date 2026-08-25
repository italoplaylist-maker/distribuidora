"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function EntitySearch({ defaultValue, placeholder }: { defaultValue?: string; placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? "");
  const [, startTransition] = useTransition();

  function onChange(v: string) {
    setValue(v);
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set("q", v);
    else params.delete("q");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

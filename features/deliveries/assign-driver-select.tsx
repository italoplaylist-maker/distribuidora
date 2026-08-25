"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { assignDriverAction } from "@/features/deliveries/actions";

export function AssignDriverSelect({ deliveryId, drivers, currentDriverId }: { deliveryId: string; drivers: { id: string; name: string }[]; currentDriverId?: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(driverId: string) {
    startTransition(async () => {
      const result = await assignDriverAction(deliveryId, driverId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Motorista atribuído");
      router.refresh();
    });
  }

  return (
    <Select value={currentDriverId ?? ""} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Atribuir motorista" />
      </SelectTrigger>
      <SelectContent>
        {drivers.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

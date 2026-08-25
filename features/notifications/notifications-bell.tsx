"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { listNotifications, markNotificationRead } from "@/features/notifications/actions";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

export function NotificationsBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      startTransition(async () => {
        const data = await listNotifications();
        setItems(data);
      });
    }
  }, [open]);

  const unreadCount = items.filter((i) => !i.read).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhuma notificação</p>}
        <div className="max-h-80 overflow-y-auto">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (!n.read) {
                  markNotificationRead(n.id);
                  setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
                }
              }}
              className={cn("flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted", !n.read && "bg-primary/5")}
            >
              <span className="font-medium">{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.message}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ptBR })}
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

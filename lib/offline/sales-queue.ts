"use client";

const STORAGE_KEY = "distribuidora:offline:pending-sales";

export interface QueuedSale {
  localId: string;
  payload: {
    customerId?: string;
    paymentMethod: string;
    discount: number;
    items: { productId: string; quantity: number }[];
  };
  createdAt: number;
}

function read(): QueuedSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSale[]) : [];
  } catch {
    return [];
  }
}

function write(queue: QueuedSale[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueSale(payload: QueuedSale["payload"]): QueuedSale {
  const entry: QueuedSale = { localId: crypto.randomUUID(), payload, createdAt: Date.now() };
  const queue = read();
  queue.push(entry);
  write(queue);
  return entry;
}

export function listQueuedSales(): QueuedSale[] {
  return read();
}

export function removeQueuedSale(localId: string) {
  write(read().filter((s) => s.localId !== localId));
}

export function queuedSalesCount(): number {
  return read().length;
}

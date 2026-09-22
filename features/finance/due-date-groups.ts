import { startOfDayBrazil } from "@/lib/timezone";

export type DueDateGroupKey = "overdue" | "today" | "next7" | "next30" | "later";

export interface DueDateGroup<T> {
  key: DueDateGroupKey;
  label: string;
  items: T[];
}

export const DUE_DATE_GROUP_LABELS: Record<DueDateGroupKey, string> = {
  overdue: "Atrasadas",
  today: "Vencem hoje",
  next7: "Próximos 7 dias",
  next30: "Próximos 30 dias",
  later: "Mais de 30 dias",
};

/** Buckets items by due date into fixed windows, skipping empty buckets. */
export function groupByDueDate<T>(items: T[], getDueDate: (item: T) => Date | string): DueDateGroup<T>[] {
  const startOfToday = startOfDayBrazil();
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const in7 = new Date(startOfToday.getTime() + 7 * 86400000);
  const in30 = new Date(startOfToday.getTime() + 30 * 86400000);

  const buckets: Record<DueDateGroupKey, T[]> = { overdue: [], today: [], next7: [], next30: [], later: [] };
  for (const item of items) {
    const due = new Date(getDueDate(item));
    if (due < startOfToday) buckets.overdue.push(item);
    else if (due < endOfToday) buckets.today.push(item);
    else if (due < in7) buckets.next7.push(item);
    else if (due < in30) buckets.next30.push(item);
    else buckets.later.push(item);
  }

  return (Object.keys(buckets) as DueDateGroupKey[])
    .map((key) => ({ key, label: DUE_DATE_GROUP_LABELS[key], items: buckets[key] }))
    .filter((g) => g.items.length > 0);
}

export interface DueDateSummary {
  total: number;
  overdue: number;
  dueIn7: number;
  /** Cumulative — everything due within 30 days, including the dueIn7 window. */
  dueIn30: number;
}

/** Sums a numeric amount per item into the same due-date windows as groupByDueDate. */
export function summarizeByDueDate<T>(items: T[], getDueDate: (item: T) => Date | string, getAmount: (item: T) => number): DueDateSummary {
  const startOfToday = startOfDayBrazil();
  const in7 = new Date(startOfToday.getTime() + 7 * 86400000);
  const in30 = new Date(startOfToday.getTime() + 30 * 86400000);

  const summary: DueDateSummary = { total: 0, overdue: 0, dueIn7: 0, dueIn30: 0 };
  for (const item of items) {
    const amount = getAmount(item);
    const due = new Date(getDueDate(item));
    summary.total += amount;
    if (due < startOfToday) summary.overdue += amount;
    else if (due < in7) {
      summary.dueIn7 += amount;
      summary.dueIn30 += amount;
    } else if (due < in30) {
      summary.dueIn30 += amount;
    }
  }
  return summary;
}

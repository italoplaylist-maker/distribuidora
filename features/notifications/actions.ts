"use server";

import { revalidatePath } from "next/cache";
import { requireRead } from "@/lib/permissions/guard";
import { prisma } from "@/lib/database/prisma";

export async function listNotifications() {
  const tenant = await requireRead();
  return prisma.notification.findMany({
    where: { companyId: tenant.companyId, OR: [{ userId: null }, { userId: tenant.userId }] },
    orderBy: { createdAt: "desc" },
    take: 15,
  });
}

export async function markNotificationRead(id: string) {
  const tenant = await requireRead();
  await prisma.notification.updateMany({
    where: { id, companyId: tenant.companyId },
    data: { read: true },
  });
  revalidatePath("/dashboard");
}

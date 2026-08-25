import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/provider";
import { prisma } from "@/lib/database/prisma";

/**
 * Generic inbound webhook for whichever payment gateway is configured.
 * Never trusts the payload before the provider verifies its signature.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature");

  const provider = getPaymentProvider();

  if (!provider.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = provider.parseWebhookEvent(rawBody);

  switch (event.type) {
    case "payment.succeeded": {
      if (event.externalPaymentId) {
        await prisma.payment.updateMany({
          where: { externalPaymentId: event.externalPaymentId },
          data: { status: "PAID", paidAt: new Date() },
        });
      }
      break;
    }
    case "payment.failed": {
      if (event.externalPaymentId) {
        await prisma.payment.updateMany({
          where: { externalPaymentId: event.externalPaymentId },
          data: { status: "FAILED" },
        });
      }
      break;
    }
    case "subscription.canceled": {
      if (event.externalSubscriptionId) {
        await prisma.subscription.updateMany({
          where: { externalSubscriptionId: event.externalSubscriptionId },
          data: { status: "CANCELED", canceledAt: new Date() },
        });
      }
      break;
    }
    case "subscription.updated":
      break;
  }

  return NextResponse.json({ received: true });
}

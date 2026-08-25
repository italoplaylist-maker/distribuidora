/**
 * Gateway-agnostic payment interface. Concrete providers (Mercado Pago,
 * Stripe, Asaas, ...) implement this so the rest of the app never depends
 * on a specific gateway's SDK/shape.
 */
export interface CreateSubscriptionInput {
  companyId: string;
  planId: string;
  billingCycle: "monthly" | "yearly";
  customerEmail: string;
  customerName: string;
  customerDocument?: string;
}

export interface CreateSubscriptionResult {
  externalSubscriptionId: string;
  checkoutUrl?: string;
}

export interface WebhookEvent {
  type: "payment.succeeded" | "payment.failed" | "subscription.canceled" | "subscription.updated";
  externalSubscriptionId?: string;
  externalPaymentId?: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult>;
  cancelSubscription(externalSubscriptionId: string): Promise<void>;
  /** Verifies the webhook signature/secret before the payload is trusted. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
  parseWebhookEvent(rawBody: string): WebhookEvent;
}

/**
 * No-op provider used while no real gateway is wired up. Lets the billing
 * UI and subscription flows run end-to-end (manual/trial plans) without a
 * hard dependency on an external gateway being configured.
 */
export class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual";

  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    return { externalSubscriptionId: `manual_${input.companyId}_${Date.now()}` };
  }

  async cancelSubscription(): Promise<void> {
    return;
  }

  verifyWebhookSignature(): boolean {
    return false;
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    return { type: "subscription.updated", raw: rawBody };
  }
}

export function getPaymentProvider(): PaymentProvider {
  // Swap this for a real provider (Stripe/MercadoPago/Asaas) once one is
  // configured via env vars — the rest of the app only depends on
  // PaymentProvider, never on a concrete gateway.
  return new ManualPaymentProvider();
}

/**
 * Payment provider abstraction.
 *
 * The checkout flow talks to this interface only — never to a provider SDK.
 * Swapping in a real provider (Stripe, SSLCommerz, …) means adding an adapter
 * below and setting PAYMENT_PROVIDER. Payment state is decided by the
 * provider's response, not by the client.
 */
import crypto from "crypto";
import { prisma } from "@/lib/db";

export type IntentResult = {
  intentId: string;
  clientSecret: string;
  status: "PENDING";
  provider: string;
  amount: number;
};
export type ConfirmResult =
  | { status: "SUCCEEDED"; intentId: string; last4?: string }
  | { status: "FAILED"; intentId: string; reason: string };

export interface PaymentProvider {
  name: string;
  createIntent(input: { amount: number; currency: string; orderId: string; metadata?: Record<string, string> }): Promise<IntentResult>;
  confirm(input: { intentId: string; method: string; token?: string }): Promise<ConfirmResult>;
}

/* ───────────────────── Sandbox adapter (deterministic test behaviour) ───────────────────── */
export class SandboxProvider implements PaymentProvider {
  name = "sandbox";

  async createIntent({ amount, orderId }: { amount: number; currency: string; orderId: string; metadata?: Record<string, string> }): Promise<IntentResult> {
    const intentId = `pi_sbx_${crypto.randomBytes(9).toString("hex")}`;
    return {
      intentId,
      clientSecret: `${intentId}_secret_${crypto.randomBytes(6).toString("hex")}`,
      status: "PENDING",
      provider: this.name,
      amount,
    };
    void orderId;
  }

  async confirm({ intentId, token }: { intentId: string; method: string; token?: string }): Promise<ConfirmResult> {
    const digits = (token ?? "").replace(/\D/g, "");
    const payment = await prisma.payment.findUnique({ where: { intentId } });
    if (!payment) return { status: "FAILED", intentId, reason: "unknown_intent" };

    let outcome: ConfirmResult;
    if (!digits) {
      outcome = { status: "FAILED", intentId, reason: "missing_payment_token" };
    } else if (digits.startsWith("4000000000000002")) {
      outcome = { status: "FAILED", intentId, reason: "card_declined" };
    } else if (digits.startsWith("4000000000009995")) {
      outcome = { status: "FAILED", intentId, reason: "insufficient_funds" };
    } else if (digits.startsWith("4000000000000069")) {
      outcome = { status: "FAILED", intentId, reason: "expired_card" };
    } else if (digits.length < 15) {
      outcome = { status: "FAILED", intentId, reason: "invalid_number" };
    } else {
      outcome = {
        status: "SUCCEEDED",
        intentId,
        last4: digits.slice(-4),
      };
    }
    await prisma.payment.update({
      where: { intentId },
      data: {
        status: outcome.status,
        last4: "last4" in outcome ? outcome.last4 : null,
        failureReason: outcome.status === "FAILED" ? outcome.reason : null,
      },
    });
    return outcome;
  }
}

/* ───────────────────── Stripe adapter skeleton (requires keys) ───────────────────── */
export class StripeProvider implements PaymentProvider {
  name = "stripe";
  private key = process.env.STRIPE_SECRET_KEY;
  private ensure() {
    if (!this.key) throw new PaymentNotConfigured("STRIPE_SECRET_KEY is not set. Use PAYMENT_PROVIDER=sandbox in development.");
    return this.key;
  }
  async createIntent({ amount, currency }: { amount: number; currency: string }): Promise<IntentResult> {
    const key = this.ensure();
    const form = new URLSearchParams({ amount: String(amount / 100), currency, "automatic_payment_methods[enabled]": "true" });
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form,
    });
    if (!res.ok) throw new Error(`Stripe intent failed: ${res.status}`);
    const json = await res.json();
    return { intentId: json.id, clientSecret: json.client_secret, status: "PENDING", provider: this.name, amount };
  }
  async confirm(): Promise<ConfirmResult> {
    throw new PaymentNotConfigured("Stripe confirmation runs client-side with @stripe/stripe-js + the webhook at /api/payments/webhook. Add the SDK to enable production payments.");
  }
}

export class PaymentNotConfigured extends Error {}

export function getProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "stripe" ? new StripeProvider() : new SandboxProvider();
}

export const SANDBOX_TEST_CARDS = [
  { number: "4242 4242 4242 4242", label: "Approves — successful authorization" },
  { number: "4000 0000 0000 0002", label: "Declines — card_declined" },
  { number: "4000 0000 0000 9995", label: "Insufficient funds" },
];

/** Provider failure codes → sentences a checkout can show without embarrassment. */
export function humanizePaymentFailure(reason: string) {
  switch (reason) {
    case "card_declined": return "Your card was declined by the issuer. Try another payment method.";
    case "insufficient_funds": return "Insufficient funds on that card.";
    case "expired_card": return "That card has expired.";
    case "invalid_number": return "That card number is not valid.";
    case "missing_payment_token": return "No payment token was provided.";
    case "unknown_intent": return "This payment session no longer exists. Start the payment again.";
    default: return "Payment could not be completed.";
  }
}

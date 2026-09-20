import { NextResponse } from "next/server";
import { safe } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProvider, humanizePaymentFailure } from "@/lib/payment";

/**
 * Step 2: confirm payment with the provider. The provider says SUCCEEDED →
 * order is paid, stock decrements, status moves forward. Any other outcome is
 * surfaced honestly — the order stays unpaid and retryable. We never fake it.
 */
export const POST = safe(async (req) => {
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId ?? "");
  const intentId = String(body.intentId ?? "");

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payments: true } });
  if (!order) return { ok: false, error: "Order not found." };

  const payment = order.payments.find((p) => p.intentId === intentId);
  if (!payment) return { ok: false, error: "Payment session not found for this order." };
  if (payment.status === "SUCCEEDED") {
    return NextResponse.json({ ok: true, alreadyConfirmed: true, orderId, status: order.status });
  }

  const provider = getProvider();
  const outcome = await provider.confirm({
    intentId,
    method: payment.method,
    token: typeof body.cardNumber === "string" ? body.cardNumber : undefined,
  });

  if (outcome.status !== "SUCCEEDED") {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: outcome.reason ?? "failed" } });
    await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "FAILED" } });
    return NextResponse.json(
      { ok: false, error: humanizePaymentFailure(outcome.reason ?? "failed"), retryable: true },
      { status: 402 }
    );
  }

  const now = new Date().toISOString();
  let timeline: { status: string; at: string; note?: string }[] = [];
  try { timeline = JSON.parse(order.timelineJson || "[]"); } catch { timeline = []; }
  timeline.push({ status: "CONFIRMED", at: now, note: "Payment authorized and captured" });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED", last4: "last4" in outcome ? outcome.last4 ?? null : null },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", status: "CONFIRMED", timelineJson: JSON.stringify(timeline) },
      });
      // decrement stock atomically — refuse if a unit vanished mid-flight
      for (const item of order.items) {
        if (!item.variantId) continue;
        const moved = await tx.inventory.updateMany({
          where: { variantId: item.variantId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
        if (moved.count === 0) throw new Error("OUT_OF_STOCK");
      }
      if (order.couponCode) {
        const cpn = await tx.coupon.findUnique({ where: { code: order.couponCode } });
        if (cpn) {
          await tx.coupon.update({ where: { id: cpn.id }, data: { usedCount: { increment: 1 } } });
          await tx.couponRedemption.create({ data: { couponId: cpn.id, userId: order.userId, orderId } });
        }
      }
    });
  } catch (e) {
    if ((e as Error)?.message === "OUT_OF_STOCK") {
      return NextResponse.json(
        { ok: false, error: "A unit sold out while payment was in flight. Nothing was charged — adjust the cart and retry.", retryable: false },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json({ ok: true, orderId, status: "CONFIRMED" });
});

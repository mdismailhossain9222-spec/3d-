import { NextResponse } from "next/server";
import { getSession, safe } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkoutSchema } from "@/lib/validators";
import { evaluateCoupon } from "@/lib/coupon";
import { getProvider } from "@/lib/payment";
import { orderNumber } from "@/lib/utils";

/**
 * Step 1 of checkout: validate cart server-side, price from the database only,
 * create the order (status PLACED) and open a payment intent.
 * The order is NOT marked paid here — only the provider decision can do that.
 */
export const POST = safe(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const data = checkoutSchema.parse(body);

  const lines: { variantId: string; quantity: number }[] = Array.isArray(body.items) ? body.items : [];
  if (!lines.length) return { ok: false, error: "Your cart is empty." } as never;

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    include: { product: { include: { images: { where: { primary: true } } } }, inventory: true },
  });
  if (variants.length !== new Set(lines.map((l) => l.variantId)).size) {
    return { ok: false, error: "Some items are no longer available. Refresh your cart." } as never;
  }

  let subtotal = 0;
  const items = lines.map((l) => {
    const v = variants.find((x) => x.id === l.variantId)!;
    const qty = Math.max(1, Math.min(l.quantity, v.inventory?.quantity ?? 0, 20));
    if (qty < 1) throw new Error(`“${v.product.name}” just sold out.`);
    subtotal += v.price * qty;
    return {
      productId: v.productId, variantId: v.id, name: v.product.name, sku: v.sku,
      label: v.label, image: v.product.images[0]?.url ?? "/renders/hero-obsidian.jpg",
      unitPrice: v.price, quantity: qty, total: v.price * qty,
    };
  });

  const session = await getSession();
  const coupon = await evaluateCoupon(data.coupon, subtotal, session?.id);
  const srows = await prisma.storeSetting.findMany({ where: { key: { in: ["freeShippingAbove", "shippingStandard", "shippingExpress", "taxRate"] } } });
  const setting = (k: string, fallback: number) => Number(srows.find((r) => r.key === k)?.value ?? fallback);
  const threshold = setting("freeShippingAbove", 5000000);

  let shipping =
    data.delivery === "PICKUP" ? 0 :
    subtotal >= threshold ? 0 :
    data.delivery === "EXPRESS" ? setting("shippingExpress", 150000) : setting("shippingStandard", 29900);
  if (coupon.freeShipping) shipping = 0;
  const discount = coupon.valid ? coupon.discount : 0;
  const tax = Math.round((subtotal - discount) * (setting("taxRate", 5) / 100));
  const total = subtotal - discount + shipping + tax;
  if (total < 0) return { ok: false, error: "Order total is invalid." } as never;

  const count = await prisma.order.count();
  const now = new Date().toISOString();
  const order = await prisma.order.create({
    data: {
      number: orderNumber(1000 + count),
      userId: session?.id ?? null,
      status: "PLACED",
      paymentStatus: "PENDING",
      subtotal, discount, shipping, tax, total,
      couponCode: coupon.valid ? coupon.code : null,
      shipName: data.shipping.fullName, shipEmail: data.shipping.email, shipPhone: data.shipping.phone,
      shipLine1: data.shipping.line1, shipLine2: data.shipping.line2 || null,
      shipCity: data.shipping.city, shipPostal: data.shipping.postalCode, shipCountry: data.shipping.country,
      deliveryMethod: data.delivery, giftNote: data.giftNote || null,
      timelineJson: JSON.stringify([{ status: "PLACED", at: now, note: "Order placed and received" }]),
      items: { create: items },
    },
  });

  const provider = getProvider();
  const intent = await provider.createIntent({
    amount: total,
    currency: "BDT",
    orderId: order.id,
    metadata: { orderNumber: order.number },
  });
  await prisma.payment.create({
    data: { orderId: order.id, provider: intent.provider, intentId: intent.intentId, method: "CARD", status: "PENDING", amount: total },
  });

  return NextResponse.json({ ok: true, orderId: order.id, orderNumber: order.number, intentId: intent.intentId, clientSecret: intent.clientSecret, total });
});

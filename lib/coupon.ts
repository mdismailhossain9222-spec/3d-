import { prisma } from "@/lib/db";

export type CouponResult = {
  valid: boolean;
  reason?: string;
  discount: number;
  freeShipping: boolean;
  code: string;
  description?: string;
};

/** Validates a coupon against the database and the order context. Pure server-side. */
export async function evaluateCoupon(
  rawCode: string | undefined | null,
  subtotal: number,
  userId?: string | null
): Promise<CouponResult> {
  const empty: CouponResult = { valid: false, discount: 0, freeShipping: false, code: "" };
  const code = (rawCode ?? "").trim().toUpperCase();
  if (!code) return empty;

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) return { ...empty, reason: `“${code}” is not a valid coupon.` };

  const now = Date.now();
  if (coupon.startsAt && coupon.startsAt.getTime() > now) return { ...empty, reason: "This coupon is not active yet." };
  if (coupon.endsAt && coupon.endsAt.getTime() < now) return { ...empty, reason: "This coupon has expired." };
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
    return { ...empty, reason: `Requires a subtotal of at least ৳${(coupon.minSubtotal / 100).toLocaleString()}.` };
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return { ...empty, reason: "This coupon has reached its usage limit." };
  if (coupon.perUser && userId) {
    const used = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.perUser) return { ...empty, reason: "You have already used this coupon." };
  }

  let discount = 0;
  let freeShipping = false;
  if (coupon.type === "PERCENT") discount = Math.round((subtotal * Math.min(coupon.value, 100)) / 100);
  if (coupon.type === "FIXED") discount = Math.min(coupon.value, subtotal);
  if (coupon.type === "FREE_SHIPPING") freeShipping = true;

  return { valid: true, discount, freeShipping, code, description: coupon.description };
}

import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";
import { couponSchema } from "@/lib/validators";

export const GET = () =>
  admin(async () => {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ ok: true, coupons });
  });

export const POST = (req: Request) =>
  admin(async () => {
    const data = couponSchema.parse(await body(req));
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Coupon “${data.code}” already exists.`);
    const coupon = await prisma.coupon.create({
      data: { ...data, minSubtotal: data.minSubtotal ?? null, maxUses: data.maxUses ?? null },
    });
    return NextResponse.json({ ok: true, id: coupon.id });
  });

export const PATCH = (req: Request) =>
  admin(async () => {
    const { id, isActive } = await body(req);
    await prisma.coupon.update({ where: { id }, data: { isActive } });
    return NextResponse.json({ ok: true });
  });

export const DELETE = (req: Request) =>
  admin(async () => {
    const { id } = await body(req);
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  });

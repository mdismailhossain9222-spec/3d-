import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";
import { dealSchema } from "@/lib/validators";

export const GET = () =>
  admin(async () => {
    const deals = await prisma.deal.findMany({
      include: { products: { select: { id: true, name: true, dealPrice: true } } },
      orderBy: { endsAt: "desc" },
    });
    return NextResponse.json({ ok: true, deals });
  });

/** Create a deal and price-apply it to the selected products (base + variants). */
export const POST = (req: Request) =>
  admin(async () => {
    const data = dealSchema.parse(await body(req));
    if (new Date(data.endsAt) <= new Date(data.startsAt)) throw new Error("End must be after start.");
    const deal = await prisma.deal.create({
      data: { title: data.title, subtitle: data.subtitle, type: data.type, badge: data.badge, startsAt: new Date(data.startsAt), endsAt: new Date(data.endsAt) },
    });

    if (data.productIds.length) {
      const products = await prisma.product.findMany({ where: { id: { in: data.productIds } } });
      for (const p of products) {
        const cfg = 1 - data.discountPercent / 100;
        await prisma.product.update({ where: { id: p.id }, data: { dealId: deal.id, dealPrice: Math.round(p.basePrice * cfg / 100) * 100 } });
        const variants = await prisma.productVariant.findMany({ where: { productId: p.id } });
        for (const v of variants) {
          const original = Number(JSON.parse(v.configJson || "{}")?.originalPrice ?? v.price);
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              price: Math.round(original * cfg / 100) * 100,
              compareAtPrice: original,
            },
          });
        }
      }
    }
    return NextResponse.json({ ok: true, id: deal.id });
  });

export const PATCH = (req: Request) =>
  admin(async () => {
    const { id, endsAt, isActive } = await body(req);
    await prisma.deal.update({
      where: { id },
      data: { ...(endsAt ? { endsAt: new Date(endsAt) } : {}), ...(isActive === false ? { endsAt: new Date() } : {}) },
    });
    return NextResponse.json({ ok: true });
  });

/** End (delete) a deal and restore original prices. */
export const DELETE = (req: Request) =>
  admin(async () => {
    const { id } = await body(req);
    const products = await prisma.product.findMany({ where: { dealId: id } });
    for (const p of products) {
      await prisma.product.update({ where: { id: p.id }, data: { dealId: null, dealPrice: null } });
      const variants = await prisma.productVariant.findMany({ where: { productId: p.id } });
      for (const v of variants) {
        const original = Number(JSON.parse(v.configJson || "{}")?.originalPrice ?? v.price);
        await prisma.productVariant.update({ where: { id: v.id }, data: { price: original, compareAtPrice: null } });
      }
    }
    await prisma.deal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  });

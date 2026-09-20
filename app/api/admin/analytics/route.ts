import { NextResponse } from "next/server";
import { admin } from "@/lib/api/admin";
import { prisma } from "@/lib/db";

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export const GET = (req: Request) =>
  admin(async () => {
    const range = Math.min(180, Math.max(7, Number(new URL(req.url).searchParams.get("range") || 30)));
    const since = new Date(Date.now() - range * DAY);

    const [orders, views, customerCount, productCount, lowStock, pendingReviews, contactCount] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gte: since } }, include: { items: true }, orderBy: { createdAt: "asc" } }),
      prisma.pageView.findMany({ where: { createdAt: { gte: since } }, select: { path: true, day: true } }),
      prisma.user.count(),
      prisma.product.count(),
      prisma.inventory.findMany({ where: { quantity: { lte: 5 } }, include: { variant: { include: { product: { select: { name: true } } } } }, take: 10 }),
      prisma.review.count({ where: { approved: false } }),
      prisma.contactMessage.count({ where: { handled: false } }),
    ]);

    const paid = orders.filter((o) => o.paymentStatus === "PAID");
    const revenue = paid.reduce((n, o) => n + o.total, 0);
    const aov = paid.length ? Math.round(revenue / paid.length) : 0;

    // daily series
    const byDay = new Map<string, { revenue: number; orders: number; views: number }>();
    for (let d = range - 1; d >= 0; d--) {
      byDay.set(dayKey(new Date(Date.now() - d * DAY)), { revenue: 0, orders: 0, views: 0 });
    }
    for (const o of paid) {
      const k = dayKey(o.createdAt);
      const row = byDay.get(k);
      if (row) { row.revenue += o.total; row.orders += 1; }
    }
    for (const v of views) {
      const row = byDay.get(v.day);
      if (row) row.views += 1;
    }
    const series = [...byDay.entries()].map(([day, v]) => ({ day, ...v }));

    // top products
    const productAgg = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const cur = productAgg.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
        cur.qty += it.quantity; cur.revenue += it.total;
        productAgg.set(it.name, cur);
      }
    }
    const topProducts = [...productAgg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // status distribution
    const statusAgg = new Map<string, number>();
    for (const o of orders) statusAgg.set(o.status, (statusAgg.get(o.status) ?? 0) + 1);

    const conversion = views.length ? (paid.length / views.length) * 100 : 0;

    return NextResponse.json({
      ok: true,
      range,
      totals: {
        revenue, orders: orders.length, paidOrders: paid.length, customers: customerCount,
        products: productCount, aov, conversion: Math.round(conversion * 100) / 100,
        pendingReviews, openMessages: contactCount,
      },
      series,
      topProducts,
      statusDistribution: [...statusAgg.entries()].map(([name, value]) => ({ name, value })),
      lowStock: lowStock.map((i) => ({ sku: i.variant.sku, name: i.variant.product.name, label: i.variant.label, quantity: i.quantity })),
    });
  });

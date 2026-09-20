import { NextResponse } from "next/server";
import { admin } from "@/lib/api/admin";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";

export const GET = (req: Request) =>
  admin(async () => {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || undefined;
    const q = url.searchParams.get("q") || undefined;
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const per = 12;

    const where = {
      ...(status ? { status } : {}),
      ...(q ? { OR: [
        { number: { contains: q } }, { shipName: { contains: q } }, { shipEmail: { contains: q } },
      ] } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where, include: { items: true, payments: true, user: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" }, skip: (page - 1) * per, take: per,
      }),
    ]);
    const orders = rows.map((o) => ({
      id: o.id, number: o.number, status: o.status, paymentStatus: o.paymentStatus,
      total: o.total, itemCount: o.items.length, createdAt: o.createdAt.toISOString(),
      shipName: o.shipName, shipCity: o.shipCity,
      items: o.items.map((it) => ({ name: it.name, label: it.label, quantity: it.quantity, total: it.total })),
      user: o.user ? { email: o.user.email, name: o.user.name } : null,
      timeline: parseJson(o.timelineJson, []),
    }));
    return NextResponse.json({ ok: true, orders, total, page, pages: Math.ceil(total / per) || 1 });
  });

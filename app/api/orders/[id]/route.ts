import { NextResponse } from "next/server";
import { requireUser, safe } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { OrderView } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = safe(async (
  _req: Request, { params }: { params: Promise<{ id: string }> }
) => {
  const u = await requireUser();
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { number: id }], userId: u.id },
    include: { items: true, payments: true },
  });
  if (!order) return { ok: false, error: "Order not found." } as never;
  const view: OrderView = {
    id: order.id, number: order.number, status: order.status, paymentStatus: order.paymentStatus,
    subtotal: order.subtotal, discount: order.discount, shipping: order.shipping, tax: order.tax, total: order.total,
    couponCode: order.couponCode, deliveryMethod: order.deliveryMethod,
    createdAt: order.createdAt.toISOString(),
    timeline: parseJson(order.timelineJson, [] as { status: string; at: string; note?: string }[]),
    items: order.items.map((i) => ({ name: i.name, sku: i.sku, label: i.label, image: i.image, unitPrice: i.unitPrice, quantity: i.quantity, total: i.total })),
    ship: { name: order.shipName, line1: order.shipLine1, line2: order.shipLine2, city: order.shipCity, postal: order.shipPostal, country: order.shipCountry, email: order.shipEmail, phone: order.shipPhone },
  };
  return NextResponse.json({ ok: true, order: view });
});

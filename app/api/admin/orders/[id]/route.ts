import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";

const FLOW = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  admin(async () => {
    const { id } = await params;
    const { status, note, paymentStatus } = await body(req);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error("Order not found");

    const data: Record<string, unknown> = {};
    if (paymentStatus && ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED"].includes(paymentStatus)) {
      data.paymentStatus = paymentStatus;
      if (paymentStatus === "REFUNDED") {
        await prisma.payment.updateMany({ where: { orderId: id }, data: { status: "REFUNDED" } });
      }
    }
    if (status && [...FLOW, "CANCELLED"].includes(status)) {
      data.status = status;
      const timeline = JSON.parse(order.timelineJson || "[]");
      timeline.push({ status, at: new Date().toISOString(), note: note || `Status set to ${status}` });
      data.timelineJson = JSON.stringify(timeline);
      if (status === "CANCELLED") {
        // restore stock
        const items = await prisma.orderItem.findMany({ where: { orderId: id } });
        for (const it of items) {
          if (it.variantId) {
            const inv = await prisma.inventory.findUnique({ where: { variantId: it.variantId } });
            if (inv) await prisma.inventory.update({ where: { id: inv.id }, data: { quantity: inv.quantity + it.quantity } });
          }
        }
      }
    }
    if (note && !data.timelineJson) {
      const timeline = JSON.parse(order.timelineJson || "[]");
      timeline.push({ status: order.status, at: new Date().toISOString(), note });
      data.timelineJson = JSON.stringify(timeline);
    }
    const updated = await prisma.order.update({ where: { id }, data });
    return NextResponse.json({ ok: true, status: updated.status, paymentStatus: updated.paymentStatus });
  });

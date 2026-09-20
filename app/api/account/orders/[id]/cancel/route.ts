import { NextResponse } from "next/server";
import { requireUser, safe } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const POST = safe(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const u = await requireUser();
  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id, userId: u.id } });
  if (!order) return { ok: false, error: "Order not found." } as never;
  if (!["PLACED", "CONFIRMED"].includes(order.status)) {
    return { ok: false, error: "This order already left the warehouse — our team can help via support." } as never;
  }
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        paymentStatus: order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus,
        timelineJson: JSON.stringify([...JSON.parse(order.timelineJson || "[]"), { status: "CANCELLED", at: new Date().toISOString(), note: "Cancelled by customer — refund initiated" }]),
      },
    });
    const items = await tx.orderItem.findMany({ where: { orderId: id } });
    for (const it of items) {
      if (it.variantId) {
        const inv = await tx.inventory.findUnique({ where: { variantId: it.variantId } });
        if (inv) await tx.inventory.update({ where: { id: inv.id }, data: { quantity: inv.quantity + it.quantity } });
      }
    }
  });
  return NextResponse.json({ ok: true });
});

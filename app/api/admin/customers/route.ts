import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";

export const GET = (req: Request) =>
  admin(async () => {
    const q = new URL(req.url).searchParams.get("q") || "";
    const rows = await prisma.user.findMany({
      where: q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : undefined,
      include: { _count: { select: { orders: true, reviews: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const customers = await Promise.all(
      rows.map(async (u) => ({
        id: u.id, name: u.name, email: u.email, role: u.roleKey, disabled: u.disabled,
        emailVerified: u.emailVerified, orders: u._count.orders, reviews: u._count.reviews,
        joinedAt: u.createdAt.toISOString(),
        lifetimeValue: (await prisma.order.aggregate({ where: { userId: u.id, paymentStatus: "PAID" }, _sum: { total: true } }))._sum.total ?? 0,
      }))
    );
    return NextResponse.json({ ok: true, customers });
  });

export const PATCH = (req: Request) =>
  admin(async () => {
    const { userId, disabled, role } = await body(req);
    if (!userId) throw new Error("userId required");
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(typeof disabled === "boolean" ? { disabled } : {}),
        ...(role === "ADMIN" || role === "CUSTOMER" ? { roleKey: role } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  });

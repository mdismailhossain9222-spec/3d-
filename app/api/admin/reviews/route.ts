import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";

export const GET = () =>
  admin(async () => {
    const reviews = await prisma.review.findMany({
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ ok: true, reviews });
  });

export const PATCH = (req: Request) =>
  admin(async () => {
    const { id, approved } = await body(req);
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new Error("Review not found");
    const wasApproved = review.approved;
    await prisma.review.update({ where: { id }, data: { approved } });
    // keep aggregates honest
    if (wasApproved !== approved) {
      const p = await prisma.product.findUnique({ where: { id: review.productId } });
      if (p) {
        const total = p.ratingCount + (approved ? 1 : -1);
        const sum = p.ratingAverage * p.ratingCount + (approved ? review.rating : -review.rating);
        await prisma.product.update({
          where: { id: p.id },
          data: { ratingCount: Math.max(0, total), ratingAverage: total > 0 ? Math.round((sum / total) * 10) / 10 : 0 },
        });
      }
    }
    return NextResponse.json({ ok: true });
  });

export const DELETE = (req: Request) =>
  admin(async () => {
    const { id } = await body(req);
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new Error("Review not found");
    await prisma.review.delete({ where: { id } });
    if (review.approved) {
      const p = await prisma.product.findUnique({ where: { id: review.productId } });
      if (p && p.ratingCount > 0) {
        const total = p.ratingCount - 1;
        const sum = p.ratingAverage * p.ratingCount - review.rating;
        await prisma.product.update({
          where: { id: p.id },
          data: { ratingCount: total, ratingAverage: total > 0 ? Math.round(sum / total * 10) / 10 : 0 },
        });
      }
    }
    return NextResponse.json({ ok: true });
  });

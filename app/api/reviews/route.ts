import { NextResponse } from "next/server";
import { getSession, safe } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reviewSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("product");
  if (!slug) return NextResponse.json({ ok: false, error: "Missing product" }, { status: 400 });
  const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return NextResponse.json({ ok: false, error: "Unknown product" }, { status: 404 });
  const reviews = await prisma.review.findMany({ where: { productId: product.id, approved: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ ok: true, reviews });
}

/** Submitting a review requires a session; it lands as pending moderation. */
export const POST = safe(async (req: Request) => {
  const u = await getSession();
  if (!u) return { ok: false, error: "Please sign in to write a review." } as never;
  const data = reviewSchema.parse(await req.json());
  const existing = await prisma.review.findUnique({ where: { productId_userId: { productId: data.productId, userId: u.id } } });
  if (existing) return { ok: false, error: "You have already reviewed this product." } as never;

  const review = await prisma.review.create({
    data: { ...data, userId: u.id, authorName: u.name, verified: true, approved: false },
  });
  return NextResponse.json({ ok: true, review, pending: true });
});

/** Mark a review helpful — no auth required, counted per IP-free demo scale. */
export async function PATCH(req: Request) {
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string") return NextResponse.json({ ok: false }, { status: 400 });
  await prisma.review.update({ where: { id }, data: { helpful: { increment: 1 } } }).catch(() => {});
  return NextResponse.json({ ok: true });
}

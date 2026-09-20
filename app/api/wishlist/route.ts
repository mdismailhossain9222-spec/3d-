import { NextResponse } from "next/server";
import { requireUser, safe } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function load(userId: string) {
  const wish = await prisma.wishlist.findUnique({
    where: { userId },
    include: { items: { include: { product: { include: { images: { where: { primary: true } } } } }, orderBy: { createdAt: "desc" } } },
  });
  const items = (wish?.items ?? []).map((i) => ({
    productId: i.product.id,
    slug: i.product.slug,
    name: i.product.name,
    price: i.product.dealPrice ?? i.product.basePrice,
    image: i.product.images[0]?.url ?? "/renders/hero-obsidian.jpg",
  }));
  return { items };
}

export const GET = safe(async () => {
    const u = await requireUser();
    return await load(u.id);
  });

export const POST = safe(async (req: Request) => {
  const u = await requireUser();
  const body = await req.json();
  const ids: string[] = Array.isArray(body.productIds) ? body.productIds : [];
  const found = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const allowed = found.map((f) => f.id);

  let wish = await prisma.wishlist.findUnique({ where: { userId: u.id } });
  if (!wish) wish = await prisma.wishlist.create({ data: { userId: u.id } });
  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wish.id } });
  for (const id of allowed) await prisma.wishlistItem.create({ data: { wishlistId: wish.id, productId: id } });

  const data = await load(u.id);
  return NextResponse.json({ ok: true, ...data });
});

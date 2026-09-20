import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProductById } from "@/lib/queries";
import { safe } from "@/lib/auth";

async function load(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { variant: { include: { product: { include: { images: true } } } } } } },
  });
  if (!cart) return { items: [] };
  const items = await Promise.all(
    cart.items.map(async (ci) => {
      const view = await getProductById(ci.variant.productId);
      const line = view?.variants.find((v) => v.id === ci.variantId);
      if (!view || !line) return null;
      return {
        variantId: ci.variantId, productId: view.id, slug: view.slug, sku: line.sku, name: view.name,
        price: line.price, compareAtPrice: line.compareAtPrice,
        image: view.image, label: line.label, qty: ci.quantity, stock: line.stock,
      };
    })
  );
  return { items: items.filter(Boolean) };
}

export const GET = safe(async () => {
    const u = await requireUser();
    return await load(u.id);
  });

/** Server-side snapshot for the client store — no pricing taken from the client. */
export const POST = safe(async (req: Request) => {
  const u = await requireUser();
  const body = await req.json();
  const lines: { variantId: string; quantity: number }[] = Array.isArray(body.items) ? body.items : [];
  const ids = lines.map((l) => l.variantId).filter((x) => typeof x === "string");
  const found = await prisma.productVariant.findMany({ where: { id: { in: ids } }, select: { id: true } });
  const allowed = new Set(found.map((f) => f.id));

  let cart = await prisma.cart.findUnique({ where: { userId: u.id } });
  if (!cart) cart = await prisma.cart.create({ data: { userId: u.id } });
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  for (const l of lines) {
    if (!allowed.has(l.variantId)) continue;
    await prisma.cartItem.create({
      data: { cartId: cart.id, variantId: l.variantId, quantity: Math.max(1, Math.min(20, Math.trunc(l.quantity) || 1)) },
    });
  }
  const data = await load(u.id);
  return NextResponse.json({ ok: true, ...data });
});

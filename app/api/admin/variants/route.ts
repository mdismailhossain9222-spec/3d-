import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";

/** Update a variant: price, active flag and/or stock. */
export const PATCH = (req: Request) =>
  admin(async () => {
    const { variantId, price, stock, isActive, label } = await body(req);
    if (!variantId) throw new Error("variantId required");
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { inventory: true } });
    if (!variant) throw new Error("Variant not found");

    await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(typeof price === "number" && price > 0 ? { price: Math.trunc(price) } : {}),
        ...(typeof label === "string" && label.length > 0 ? { label } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
    });
    if (typeof stock === "number") {
      const q = Math.max(0, Math.trunc(stock));
      if (variant.inventory) {
        await prisma.inventory.update({ where: { variantId }, data: { quantity: q } });
      } else {
        await prisma.inventory.create({ data: { variantId, quantity: q } });
      }
    }
    return NextResponse.json({ ok: true });
  });

/** Add a variant to a product (admin product editor). */
export const POST = (req: Request) =>
  admin(async () => {
    const { productId, label, price, stock = 0, sku } = await body(req);
    if (!productId || !label || typeof price !== "number") throw new Error("productId, label and price are required");
    const finalSku = sku || `FS-${Date.now().toString(36).toUpperCase()}`;
    const variant = await prisma.productVariant.create({
      data: {
        productId, label, price, sku: finalSku,
        configJson: JSON.stringify({ originalPrice: price }),
      },
    });
    await prisma.inventory.create({ data: { variantId: variant.id, quantity: Math.max(0, Math.trunc(stock)) } });
    return NextResponse.json({ ok: true, variantId: variant.id, sku: finalSku });
  });

import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";

export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  admin(async () => {
    const { id } = await params;
    const patch = await body(req);
    const allowed = ["name", "tagline", "description", "basePrice", "compareAtPrice", "featured", "isNew", "badge"] as const;
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (k in patch) data[k] = patch[k];
    if ("categorySlug" in patch) {
      const cat = await prisma.category.findUnique({ where: { slug: String(patch.categorySlug) } });
      if (cat) data.categoryId = cat.id;
    }
    const product = await prisma.product.update({ where: { id }, data });
    // price edits cascade to the default variant if there is only one
    if (typeof data.basePrice === "number") {
      const vs = await prisma.productVariant.findMany({ where: { productId: id } });
      if (vs.length === 1) {
        await prisma.productVariant.update({ where: { id: vs[0].id }, data: { price: data.basePrice } });
      }
    }
    return NextResponse.json({ ok: true, id: product.id });
  });

export const DELETE = (_req: Request, { params }: { params: Promise<{ id: string }> }) =>
  admin(async () => {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  });

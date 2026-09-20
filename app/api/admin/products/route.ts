import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";
import { adminProductSchema } from "@/lib/validators";
import { toCard, productInclude } from "@/lib/queries";
import { slugify } from "@/lib/utils";

export const GET = () =>
  admin(async () => {
    const rows = await prisma.product.findMany({
      include: {
        ...productInclude,
        variants: { include: { inventory: true }, orderBy: { price: "asc" as const } },
      },
      orderBy: { createdAt: "desc" },
    });
    const products = (rows as unknown as { variants?: { id: string; sku: string; label: string; price: number; isActive: boolean; inventory: { quantity: number } | null }[] }[]).map((r) => ({
      ...toCard(r as never),
      variants: (r.variants ?? []).map((v) => ({
        id: v.id, sku: v.sku, label: v.label, price: v.price, active: v.isActive, stock: v.inventory?.quantity ?? 0,
      })),
    }));
    return NextResponse.json({ ok: true, products });
  });

export const POST = (req: Request) =>
  admin(async () => {
    const data = adminProductSchema.parse(await body(req));
    const cat = await prisma.category.findUnique({ where: { slug: data.categorySlug } });
    if (!cat) throw new Error("Unknown category slug.");

    let slug = data.slug || slugify(data.name);
    for (let i = 0; i < 50; i++) {
      const exists = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) break;
      slug = `${data.slug || slugify(data.name)}-${i + 2}`;
    }

    const product = await prisma.product.create({
      data: {
        slug, name: data.name, tagline: data.tagline, description: data.description,
        categoryId: cat.id, basePrice: data.basePrice, compareAtPrice: data.compareAtPrice ?? null,
        featured: data.featured, isNew: data.isNew, badge: data.badge ?? null,
        colorsJson: JSON.stringify([{ key: "obsidian", label: "Obsidian", hex: "#0B0B0D", frameHex: "#1d1d20", priceDelta: 0 }]),
        specsJson: JSON.stringify({ flat: {}, groups: [] }),
        highlightsJson: JSON.stringify([]),
      },
    });
    await prisma.productImage.create({ data: { productId: product.id, url: data.primaryImage, alt: data.name, primary: true, position: 0 } });
    const sku = `FS-${slugify(data.name).toUpperCase().slice(0, 8)}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id, sku, label: "Standard", price: data.basePrice,
        compareAtPrice: data.compareAtPrice ?? null,
        configJson: JSON.stringify({ originalPrice: data.basePrice }),
      },
    });
    await prisma.inventory.create({ data: { variantId: variant.id, quantity: 10 } });
    return NextResponse.json({ ok: true, id: product.id, slug });
  });

import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export const GET = () =>
  admin(async () => {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } }, parent: { select: { name: true, slug: true } } },
      orderBy: [{ parentId: "asc" }, { position: "asc" }],
    });
    return NextResponse.json({ ok: true, categories });
  });

export const POST = (req: Request) =>
  admin(async () => {
    const { name, parentId } = await body(req);
    if (!name) throw new Error("Name is required");
    const cat = await prisma.category.create({
      data: { name, slug: slugify(name), parentId: parentId || null },
    });
    return NextResponse.json({ ok: true, id: cat.id });
  });

export const PATCH = (req: Request) =>
  admin(async () => {
    const { id, name, description } = await body(req);
    await prisma.category.update({
      where: { id },
      data: { ...(name ? { name, slug: slugify(name) } : {}), ...(description !== undefined ? { description } : {}) },
    });
    return NextResponse.json({ ok: true });
  });

export const DELETE = (req: Request) =>
  admin(async () => {
    const { id } = await body(req);
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) throw new Error(`Category still has ${count} products. Move them first.`);
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  });

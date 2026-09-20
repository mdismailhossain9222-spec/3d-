import { NextResponse } from "next/server";
import { searchSuggest } from "@/lib/queries";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 64).trim();
  const products = await searchSuggest(q, q ? 8 : 4);
  const categories = q
    ? await prisma.category.findMany({ where: { name: { contains: q } }, take: 3, select: { name: true, slug: true } })
    : [];
  return NextResponse.json({ ok: true, query: q, products, categories });
}

import { NextResponse } from "next/server";
import { listProducts, getProductBySlug } from "@/lib/queries";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const slugs = p.get("slugs");
  if (slugs) {
    const list = (await Promise.all(slugs.split(",").slice(0, 12).map((s) => getProductBySlug(s.trim())))).filter(Boolean);
    return NextResponse.json({ ok: true, items: list, total: list.length });
  }
  const num = (k: string) => (p.get(k) ? Math.max(0, Number(p.get(k))) : undefined);
  const [min, max] = [num("min"), num("max")];
  const res = await listProducts({
    q: p.get("q") ?? undefined,
    categorySlug: p.get("category") ?? undefined,
    ram: num("ram"),
    storage: num("storage"),
    color: p.get("color") ?? undefined,
    rating: p.get("rating") ? Number(p.get("rating")) : undefined,
    available: p.get("available") ? true : undefined,
    onSale: p.get("sale") ? true : undefined,
    min: min && min > 0 ? min : undefined,
    max: max && max > 0 ? max : undefined,
    sort: (p.get("sort") as never) ?? "featured",
    page: num("page") || 1,
    perPage: Math.min(48, num("perPage") || 12),
    full: true,
  });
  return NextResponse.json({ ok: true, ...res });
}

import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { ColorDef } from "@/lib/types";

export async function getFacets() {
  const rows = await prisma.product.findMany({
    select: { colorsJson: true, variants: { select: { ramGb: true, storageGb: true } } },
  });
  const colors = new Map<string, ColorDef>();
  for (const r of rows) {
    for (const c of parseJson<ColorDef[]>(r.colorsJson, [])) if (!colors.has(c.key)) colors.set(c.key, c);
  }
  const rams = new Set<number>();
  const storages = new Set<number>();
  for (const r of rows) {
    for (const v of r.variants) {
      if (v.ramGb) rams.add(v.ramGb);
      if (v.storageGb) storages.add(v.storageGb);
    }
  }
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: { slug: true, name: true },
    orderBy: { position: "asc" },
  });
  return {
    colors: [...colors.values()].map((c) => ({ key: c.key, label: c.label, hex: c.hex })),
    rams: [...rams].sort((a, b) => a - b),
    storages: [...storages].sort((a, b) => a - b),
    categories,
  };
}

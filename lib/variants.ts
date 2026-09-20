import type { ProductView, VariantView } from "@/lib/types";

export type ColorChoice = { key: string; label: string; hex: string; frameHex: string; priceDelta: number; inStock: boolean; minPrice: number };

export function optionAxes(p: ProductView) {
  const colors: ColorChoice[] = p.colors.map((c) => {
    const vs = p.variants.filter((v) => v.colorKey === c.key);
    return {
      ...c,
      inStock: vs.some((v) => v.stock > 0),
      minPrice: vs.length ? Math.min(...vs.map((v) => v.price)) : p.basePrice,
    };
  });
  const ramOptions = [...new Set(p.variants.map((v) => v.ramGb).filter((x): x is number => x != null))].sort((a, b) => a - b);
  const storageOptions = [...new Set(p.variants.map((v) => v.storageGb).filter((x): x is number => x != null))].sort((a, b) => a - b);
  const sizeOptions = [...new Set(p.variants.map((v) => v.sizeLabel).filter((x): x is string => !!x))];

  return { colors, ramOptions, storageOptions, sizeOptions };
}

export function findVariant(
  p: ProductView,
  sel: { color: string | null; ram: number | null; storage: number | null; size: string | null }
): VariantView | undefined {
  const match = (v: VariantView) =>
    (!sel.color || v.colorKey === sel.color) &&
    (sel.ram == null || v.ramGb === sel.ram) &&
    (sel.storage == null || v.storageGb === sel.storage) &&
    (!sel.size || v.sizeLabel === sel.size);

  const exact = p.variants.filter(match);
  if (exact.length) return exact.find((v) => v.stock > 0) ?? exact[0];

  // relax axes in order (storage → ram → size) so a sensible fallback is always offered
  const relaxed = p.variants.filter((v) =>
    (!sel.color || v.colorKey === sel.color) &&
    (sel.ram == null || v.ramGb === sel.ram)
  );
  return relaxed.find((v) => v.stock > 0) ?? relaxed[0] ?? p.variants[0];
}

export function priceFor(p: ProductView, sel: Parameters<typeof findVariant>[1]) {
  const v = findVariant(p, sel);
  return { price: v?.price ?? p.basePrice, compareAt: v?.compareAtPrice ?? p.compareAtPrice, variant: v };
}

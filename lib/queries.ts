import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { ColorDef, ProductCardView, ProductView, ReviewView, Specs, VariantView } from "@/lib/types";

export const productInclude = {
  category: true,
  images: { orderBy: { position: "asc" as const } },
  variants: {
    where: { isActive: true },
    include: { inventory: true },
    orderBy: { price: "asc" as const },
  },
  deal: true,
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type VariantRow = ProductRow["variants"][number];

function toVariant(v: VariantRow): VariantView {
  const cfg = parseJson<{ size?: string }>(v.configJson, {});
  return {
    id: v.id, sku: v.sku, label: v.label, colorKey: v.colorKey,
    ramGb: v.ramGb, storageGb: v.storageGb, price: v.price,
    compareAtPrice: v.compareAtPrice, stock: v.inventory?.quantity ?? 0,
    sizeLabel: cfg.size ?? null,
  };
}

export function toCard(p: ProductRow): ProductCardView {
  const colors = parseJson<ColorDef[]>(p.colorsJson, []);
  const variants = (p.variants ?? []).map(toVariant);
  const img = p.images?.find((i) => i.primary) ?? p.images?.[0];
  const dealActive = p.deal && new Date(p.deal.endsAt).getTime() > Date.now();
  return {
    id: p.id, slug: p.slug, name: p.name, tagline: p.tagline, brand: p.brand,
    basePrice: p.dealPrice && dealActive ? p.dealPrice : p.basePrice,
    compareAtPrice: dealActive ? p.compareAtPrice ?? p.basePrice : p.compareAtPrice,
    currency: p.currency,
    ratingAverage: p.ratingAverage, ratingCount: p.ratingCount,
    featured: p.featured, isNew: p.isNew, badge: dealActive ? p.deal!.badge ?? p.badge : p.badge,
    image: img?.url ?? "/renders/hero-obsidian.jpg",
    imageAlt: img?.alt ?? p.name,
    colors,
    categorySlug: p.category?.slug ?? "", categoryName: p.category?.name ?? "",
    deal: dealActive ? { title: p.deal!.title, endsAt: p.deal!.endsAt.toISOString(), type: p.deal!.type } : null,
    onSale: Boolean(dealActive && p.dealPrice),
    totalStock: variants.reduce((n, v) => n + v.stock, 0),
    createdAt: p.createdAt.toISOString(),
  };
}

export function toView(p: ProductRow): ProductView {
  return {
    ...toCard(p),
    description: p.description,
    highlights: parseJson<string[]>(p.highlightsJson, []),
    specs: parseJson<Specs>(p.specsJson, { flat: {}, groups: [] }),
    images: (p.images ?? []).map((i) => ({ url: i.url, alt: i.alt, colorKey: i.colorKey })),
    variants: (p.variants ?? []).map(toVariant),
    reviewCount: 0,
  };
}

type ListBase = {
  q?: string;
  categorySlug?: string;
  categories?: string[];
  ram?: number;
  storage?: number;
  color?: string;
  min?: number;
  max?: number;
  rating?: number;
  available?: boolean;
  onSale?: boolean;
  sort?: "featured" | "newest" | "price-asc" | "price-desc" | "rating";
  page?: number;
  perPage?: number;
  full?: boolean; // return ProductView (with variants) instead of cards
};

export async function listProducts(opts: ListBase & { full: true }): Promise<{ items: ProductView[]; total: number; page: number; perPage: number }>;
export async function listProducts(opts?: ListBase & { full?: false }): Promise<{ items: ProductCardView[]; total: number; page: number; perPage: number }>;
export async function listProducts(opts: ListBase = {}) {
  const rows = (await prisma.product.findMany({
    where: {
      AND: [
        opts.categorySlug ? { OR: [
          { category: { slug: opts.categorySlug } },
          { category: { parent: { slug: opts.categorySlug } } },
        ] } : {},
        opts.categories?.length ? { category: { OR: [
          { slug: { in: opts.categories } },
          { parent: { slug: { in: opts.categories } } },
        ] } } : {},
        opts.q
          ? { OR: [
              { name: { contains: opts.q } },
              { tagline: { contains: opts.q } },
              { description: { contains: opts.q } },
            ] }
          : {},
      ],
    },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  })) as unknown as ProductRow[];

  let items = rows.map(toCard);
  const variantRows = new Map(rows.map((r) => [r.id, (r.variants ?? []).map(toVariant)]));

  if (opts.ram) items = items.filter((i) => variantRows.get(i.id)?.some((v) => v.ramGb === opts.ram));
  if (opts.storage) items = items.filter((i) => variantRows.get(i.id)?.some((v) => v.storageGb === opts.storage));
  if (opts.color) items = items.filter((i) => i.colors.some((c) => c.key === opts.color));
  if (opts.available) items = items.filter((i) => i.totalStock > 0);
  if (opts.onSale) items = items.filter((i) => i.onSale);
  if (opts.min != null) items = items.filter((i) => i.basePrice >= opts.min!);
  if (opts.max != null) items = items.filter((i) => i.basePrice <= opts.max!);
  if (opts.rating) items = items.filter((i) => i.ratingAverage >= opts.rating!);

  switch (opts.sort) {
    case "price-asc": items.sort((a, b) => a.basePrice - b.basePrice); break;
    case "price-desc": items.sort((a, b) => b.basePrice - a.basePrice); break;
    case "rating": items.sort((a, b) => b.ratingAverage - a.ratingAverage); break;
    case "newest": items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break;
    default:
      items.sort((a, b) => Number(b.featured) - Number(a.featured) || b.ratingAverage - a.ratingAverage);
  }

  const perPage = opts.perPage ?? 12;
  const total = items.length;
  const page = Math.max(1, opts.page ?? 1);
  const sliced = items.slice((page - 1) * perPage, page * perPage);
  const out = opts.full
    ? sliced.map((c) => toView(rows.find((r) => r.id === c.id)!))
    : sliced;
  return { items: out, total, page, perPage };
}

export async function getProductBySlug(slug: string) {
  const row = (await prisma.product.findUnique({ where: { slug }, include: productInclude })) as unknown as ProductRow | null;
  if (!row) return null;
  const view = toView(row);
  view.reviewCount = await prisma.review.count({ where: { productId: row.id, approved: true } });
  return view;
}

export async function getProductById(id: string) {
  const row = (await prisma.product.findUnique({ where: { id }, include: productInclude })) as unknown as ProductRow | null;
  return row ? toView(row) : null;
}

export async function getReviews(productId: string): Promise<ReviewView[]> {
  const rows = await prisma.review.findMany({
    where: { productId, approved: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  });
  return rows.map((r) => ({
    id: r.id, authorName: r.authorName, rating: r.rating, title: r.title, body: r.body,
    verified: r.verified, helpful: r.helpful, createdAt: r.createdAt.toISOString(), userId: r.userId,
  }));
}

export async function getDealProducts(dealType?: string) {
  const rows = (await prisma.product.findMany({
    where: { deal: dealType ? { type: dealType } : undefined },
    include: productInclude,
  })) as unknown as ProductRow[];
  return rows.map(toCard);
}

export async function getDeals() {
  return prisma.deal.findMany({ orderBy: { startsAt: "desc" }, include: { _count: { select: { products: true } } } });
}

export async function searchSuggest(q: string, limit = 6) {
  const rows = (await prisma.product.findMany({
    where: {
      OR: q
        ? [
            { name: { contains: q } },
            { tagline: { contains: q } },
            { category: { name: { contains: q } } },
          ]
        : [{ featured: true }],
    },
    include: productInclude,
    take: limit,
  })) as unknown as ProductRow[];
  return rows.map(toCard);
}

export async function getHomeData() {
  const [phones, accessories, sale, featured] = await Promise.all([
    listProducts({ categories: ["phones"], sort: "featured", perPage: 4 }),
    listProducts({ categories: ["accessories"], perPage: 4 }),
    listProducts({ onSale: true, perPage: 3 }),
    prisma.product.findMany({ where: { slug: "faistof-one" }, include: productInclude }),
  ]);
  return {
    phones: phones.items,
    accessories: accessories.items,
    sale: sale.items,
    hero: featured[0] ? toView(featured[0] as unknown as ProductRow) : null,
  };
}

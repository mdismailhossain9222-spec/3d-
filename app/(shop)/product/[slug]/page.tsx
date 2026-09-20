import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getReviews, listProducts } from "@/lib/queries";
import { ProductExperience } from "@/components/product/product-experience";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ color?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: `${product.tagline} — ${product.highlights.slice(0, 2).join(" · ")}`,
    openGraph: {
      title: product.name,
      description: product.tagline,
      images: [{ url: product.image }],
    },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { color } = await searchParams;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, relatedRes, session] = await Promise.all([
    getReviews(product.id),
    listProducts({ full: true, perPage: 4, categorySlug: undefined }),
    getSession(),
  ]);
  const related = (relatedRes.items as typeof relatedRes.items).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <ProductExperience
      product={product}
      reviews={reviews}
      related={related}
      initialColor={color ?? null}
      canReview={Boolean(session)}
    />
  );
}

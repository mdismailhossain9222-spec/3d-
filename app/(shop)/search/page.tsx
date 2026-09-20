import type { Metadata } from "next";
import { Suspense } from "react";
import { listProducts } from "@/lib/queries";
import { getFacets } from "@/lib/facets";
import { ShopClient } from "@/components/shop/shop-client";
import { SectionHead } from "@/components/ui/bits";
import { ShopSkeleton } from "@/app/(shop)/shop/page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [{ items, total }, facets] = await Promise.all([
    listProducts({ q: q || undefined, full: true, perPage: 12 }),
    getFacets(),
  ]);
  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 pt-32 md:px-8">
      <SectionHead kicker="Search" title={q ? <>Results for “{q}”.</> : "Find your instrument."} sub={q ? `${total} product${total === 1 ? "" : "s"} matched. Filter further without leaving the page.` : "Type below — results update live against the real catalog."} />
      <div className="mt-8">
        <Suspense fallback={<ShopSkeleton />}>
          <ShopClient initial={items} initialTotal={total} facets={facets} />
        </Suspense>
      </div>
    </div>
  );
}

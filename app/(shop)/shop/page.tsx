import type { Metadata } from "next";
import { Suspense } from "react";
import { listProducts } from "@/lib/queries";
import { getFacets } from "@/lib/facets";
import { ShopClient } from "@/components/shop/shop-client";
import { SectionHead, Skeleton } from "@/components/ui/bits";
import { LinkGrid } from "@/components/shop/collections-strip";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "All FAISTOF products — phones, audio, wearables and power. Filter, compare and configure.",
};

export default async function ShopPage() {
  const [{ items, total }, facets] = await Promise.all([
    listProducts({ full: true, perPage: 12, sort: "featured" }),
    getFacets(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 pt-32 md:px-8">
      <SectionHead kicker="Store" title="The full arsenal." sub="Nine instruments, one obsession. Filter by what matters to you — every result is a real record." />
      <LinkGrid />
      <div className="mt-10">
        <Suspense fallback={<ShopSkeleton />}>
          <ShopClient initial={items} initialTotal={total} facets={facets} />
        </Suspense>
      </div>
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <div className="hidden space-y-8 lg:block">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-[480px]" />)}
      </div>
    </div>
  );
}

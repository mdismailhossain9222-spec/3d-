import type { Metadata } from "next";
import { Suspense } from "react";
import { listProducts } from "@/lib/queries";
import { getFacets } from "@/lib/facets";
import { ShopClient } from "@/components/shop/shop-client";
import { ShopSkeleton } from "@/app/(shop)/shop/page";
import { SectionHead } from "@/components/ui/bits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accessories",
  description: "FAISTOF WATCH, BUDS, CHARGE, CASE and POWER — engineered beside the phones.",
};

export default async function AccessoriesPage() {
  const [{ items, total }, facets] = await Promise.all([
    listProducts({ categorySlug: "accessories", full: true, perPage: 12, sort: "featured" }),
    getFacets(),
  ]);
  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 pt-32 md:px-8">
      <SectionHead kicker="Ecosystem" title="Companions,<br />not add-ons." sub="Each accessory was prototyped against the phone — thermals, magnets, codecs, latency. Nothing ships as an afterthought." />
      <div className="mt-10">
        <Suspense fallback={<ShopSkeleton />}>
          <ShopClient initial={items} initialTotal={total} facets={facets} lockedCategory="accessories" />
        </Suspense>
      </div>
    </div>
  );
}

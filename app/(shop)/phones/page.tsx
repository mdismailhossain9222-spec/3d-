import type { Metadata } from "next";
import { Suspense } from "react";
import { listProducts } from "@/lib/queries";
import { getFacets } from "@/lib/facets";
import { ShopClient } from "@/components/shop/shop-client";
import { ShopSkeleton } from "@/app/(shop)/shop/page";
import { SectionHead } from "@/components/ui/bits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Phones",
  description: "The FAISTOF smartphone line — ONE, ONE PRO, ONE ULTRA and LITE.",
};

export default async function PhonesPage() {
  const [{ items, total }, facets] = await Promise.all([
    listProducts({ categorySlug: "phones", full: true, perPage: 12, sort: "featured" }),
    getFacets(),
  ]);
  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 pt-32 md:px-8">
      <SectionHead kicker="Smartphones" title="Four phones.<br />No filler." sub="From the founding flagship to the essential LITE — every handset shares the same design conviction." />
      <div className="mt-10">
        <Suspense fallback={<ShopSkeleton />}>
          <ShopClient initial={items} initialTotal={total} facets={facets} lockedCategory="phones" />
        </Suspense>
      </div>
    </div>
  );
}

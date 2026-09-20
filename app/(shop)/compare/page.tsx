import type { Metadata } from "next";
import { listProducts, getProductBySlug } from "@/lib/queries";
import { CompareBoard } from "@/components/shop/compare-board";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare", description: "Line FAISTOF devices up, spec by spec." };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  const slugs = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const selected = slugs.length
    ? (await Promise.all(slugs.map((s) => getProductBySlug(s)))).filter((v): v is NonNullable<typeof v> => v !== null)
    : [];
  const all = await listProducts({ full: true, perPage: 12, sort: "featured" });
  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 pt-32 md:px-8">
      <CompareBoard initial={selected} all={all.items} />
    </div>
  );
}

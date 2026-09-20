"use client";

import { useEffect, useState } from "react";
import { useWishlist } from "@/lib/store";
import type { ProductView } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState, Skeleton } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import Link from "next/link";
import { X } from "lucide-react";
import { formatTk } from "@/lib/money";

/** Reads the wishlist store, hydrates full product views from the API, keeps the grid honest. */
export function WishlistClient({ canLogin }: { canLogin: boolean }) {
  const wish = useWishlist();
  const [views, setViews] = useState<ProductView[] | null>(null);

  useEffect(() => {
    let alive = true;
    if (!wish.items.length) { setViews([]); return; }
    fetch(`/api/products?slugs=${wish.items.map((w) => w.slug).join(",")}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setViews(d.items ?? []); })
      .catch(() => alive && setViews([]));
    return () => { alive = false; };
  }, [wish.items.map((w) => w.productId).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (wish.count === 0) {
    return (
      <div className="rounded-lg border border-white/[0.07] bg-gradient-to-b from-iron/40 to-transparent">
        <EmptyState
          illustration="heart"
          title="Nothing saved yet."
          body="Tap the heart on any product and it waits here — across pages, sessions and moods."
          cta={<div className="flex gap-3"><ButtonLink href="/phones">Explore phones</ButtonLink><ButtonLink href="/accessories" variant="outline">Accessories</ButtonLink></div>}
        />
      </div>
    );
  }

  if (!views) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(wish.count)].map((_, i) => <Skeleton key={i} className="h-[460px]" />)}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="num text-[12px] text-ash">{wish.count} saved · <button onClick={wish.clear} className="text-ember hover:underline">clear all</button></p>
        {!canLogin && <Link href="/login?next=/wishlist" className="font-mono text-[10.5px] uppercase tracking-widest text-crimson hover:underline">Sign in to sync across devices →</Link>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {views.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
      <ul className="mt-8 hidden">
        {views.filter((p) => !wish.items.some((w) => w.productId === p.id)).map(() => <li key="x" />)}
      </ul>
    </>
  );
}

export function WishlistMiniRow() {
  const wish = useWishlist();
  if (!wish.count) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      {wish.items.map((w) => (
        <span key={w.productId} className="group flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-abyss/70 py-1 pl-1 pr-2.5 text-[11px]">
          <img src={w.image} alt="" className="h-6 w-6 rounded-full bg-iron object-contain p-0.5" />
          {w.name} · {formatTk(w.price)}
          <button onClick={() => wish.toggle(w)} aria-label={`Remove ${w.name} from wishlist`} className="text-ash hover:text-ember"><X className="h-3 w-3" /></button>
        </span>
      ))}
    </div>
  );
}

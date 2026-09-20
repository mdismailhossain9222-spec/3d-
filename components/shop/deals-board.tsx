"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Flame, Gift, Layers, Headphones } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/bits";
import { Countdown } from "@/lib/countdown";
import { formatTk } from "@/lib/money";
import { useCart } from "@/lib/store";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

type Deal = {
  id: string; title: string; subtitle: string; type: string; badge: string | null; banner: string | null;
  startsAt: string; endsAt: string; products: ProductView[];
};
type Coupon = { code: string; description: string; type: string; value: number; minSubtotal: number | null; endsAt: string | null };

const ICONS: Record<string, React.ReactNode> = {
  FLASH: <Flame className="h-4 w-4" />, FLAGSHIP: <Layers className="h-4 w-4" />,
  BUNDLE: <Gift className="h-4 w-4" />, ACCESSORY: <Headphones className="h-4 w-4" />,
};

export function DealsBoard({ deals, coupons }: { deals: Deal[]; coupons: Coupon[] }) {
  const flash = deals.find((d) => d.type === "FLASH") ?? deals[0];
  const rest = deals.filter((d) => d !== flash);
  const cart = useCart();
  const toast = useToast();

  const addBundle = (d: Deal) => {
    let n = 0;
    for (const p of d.products) {
      const v = p.variants.find((x) => x.stock > 0);
      if (v) {
        cart.add({ variantId: v.id, productId: p.id, slug: p.slug, sku: v.sku, name: p.name, price: v.price, compareAtPrice: v.compareAtPrice, image: p.image, label: v.label, stock: v.stock });
        n++;
      }
    }
    if (!n) toast.push({ kind: "warning", title: "Nothing to add", body: "Bundle items are out of stock right now." });
  };

  return (
    <>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="label-tech mb-3 flex items-center gap-2"><span className="h-px w-8 bg-crimson" />Offer theatre · live clocks</p>
          <h1 className="text-hero text-[clamp(2.2rem,6vw,3.8rem)]">Offers worth<br />the wait.</h1>
        </div>
        <p className="max-w-sm text-[13px] leading-relaxed text-ash">
          Every window below runs on the same clock as our warehouse. When it closes, the price closes with it.
        </p>
      </header>

      {flash && (
        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-xl border border-crimson/25 bg-gradient-to-br from-[#160507] via-carbon to-abyss" aria-label="Flash deal">
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(50%_70%_at_80%_30%,rgba(215,25,32,0.25),transparent_65%)]" />
          <div className="relative grid gap-6 p-6 md:grid-cols-[1.1fr_1fr] md:p-10">
            <div>
              <div className="flex items-center gap-3">
                <Badge tone="crimson">Flash · {flash.badge ?? "limited"}</Badge>
                <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-crimson">
                  <span className="h-1.5 w-1.5 animate-pulse-crim rounded-full bg-crimson" />ends in
                </span>
                <Countdown endsAt={flash.endsAt} />
              </div>
              <h2 className="mt-4 font-display text-[clamp(1.6rem,3.6vw,2.6rem)] font-bold uppercase leading-tight tracking-tight">{flash.title}</h2>
              <p className="mt-2 max-w-md text-[13.5px] text-ash">{flash.subtitle}</p>
              {flash.products[0] && (
                <p className="num mt-5 flex items-end gap-3">
                  <span className="text-crimson text-[30px] font-bold leading-none">{formatTk(flash.products[0].basePrice)}</span>
                  {flash.products[0].compareAtPrice && <span className="pb-1 text-[14px] text-ash line-through">{formatTk(flash.products[0].compareAtPrice)}</span>}
                  {flash.products[0].compareAtPrice && (
                    <span className="mb-1 rounded-sm bg-crimson px-1.5 py-0.5 font-mono text-[9.5px] text-white">
                      −{Math.round((1 - flash.products[0].basePrice / flash.products[0].compareAtPrice) * 100)}%
                    </span>
                  )}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <ButtonLink href="/product/faistof-one">Claim the ONE</ButtonLink>
                <Link href="/compare" className="inline-flex h-11 items-center rounded-sm border border-white/25 px-6 font-display text-[12px] font-semibold uppercase tracking-[0.16em] transition-colors hover:border-white/50">Compare</Link>
              </div>
            </div>
            <div className="relative grid place-items-center">
              <motion.img src="/renders/hero-obsidian.jpg" alt="FAISTOF ONE" className="max-h-[320px] w-auto object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.8)]" animate={{ y: [0, -10, 0], rotate: [0, -1.5, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
            </div>
          </div>
        </motion.section>
      )}

      {rest.map((d) => (
        <section key={d.id} className="mt-14" aria-label={d.title}>
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-crimson/35 bg-crimson/10 text-crimson">{ICONS[d.type]}</span>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold uppercase tracking-tight">{d.title}</h3>
              <p className="text-[12px] text-ash">{d.subtitle}</p>
            </div>
            <span className="ml-auto flex items-center gap-2 rounded-sm border border-white/10 bg-abyss px-2.5 py-1.5">
              <span className="label-tech !text-[8px]">ends</span><Countdown endsAt={d.endsAt} compact />
            </span>
            {d.type === "BUNDLE" && (
              <button onClick={() => addBundle(d)} className="rounded-sm bg-gradient-to-b from-crimson to-[#9d0f15] px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.14em] shadow-crim transition-all hover:from-ember active:scale-95">
                Add bundle to cart
              </button>
            )}
          </div>
          {d.products.length ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {d.products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-white/10 p-6 text-center text-[12px] text-ash">This offer is fully claimed — new windows open weekly.</p>
          )}
        </section>
      ))}

      {coupons.length > 0 && (
        <section className="mt-16" aria-labelledby="coupons-h">
          <h3 id="coupons-h" className="mb-4 font-display text-lg font-bold uppercase tracking-tight">Open coupons</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {coupons.map((c) => (
              <div key={c.code} className="group relative overflow-hidden rounded-md border border-dashed border-crimson/35 bg-abyss/60 p-4 transition-colors hover:border-crimson/70">
                <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-crimson/10 blur-2xl transition-opacity group-hover:opacity-100" />
                <p className="flex items-center justify-between">
                  <span className="num font-mono text-[15px] font-bold tracking-[0.2em] text-crimson">{c.code}</span>
                  <button
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(c.code); } catch { /* clipboard blocked */ }
                      toast.push({ kind: "success", title: `“${c.code}” copied`, body: "Paste it at checkout." });
                    }}
                    aria-label={`Copy coupon ${c.code}`}
                    className="rounded-sm p-1.5 text-ash transition-all hover:bg-white/10 hover:text-white active:scale-90"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </p>
                <p className="mt-1.5 text-[12.5px] text-mist">{c.description}</p>
                <p className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-ash">
                  {c.type === "PERCENT" ? `${c.value}% off` : c.type === "FIXED" ? `${formatTk(c.value)} off` : "shipping covered"}
                  {c.minSubtotal && <span>· min {formatTk(c.minSubtotal)}</span>}
                  {c.endsAt && <span>· ends <Countdown endsAt={c.endsAt} compact /></span>}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className={cn("mt-16 flex items-center justify-between rounded-lg border border-white/[0.07] bg-gradient-to-r from-crimson/[0.09] to-transparent px-6 py-5")}>
        <p className="text-[13px] text-ash">Deals apply automatically at cart — no hunting for codes.</p>
        <ButtonLink href="/shop" variant="outline" size="md">Browse everything</ButtonLink>
      </div>
    </>
  );
}

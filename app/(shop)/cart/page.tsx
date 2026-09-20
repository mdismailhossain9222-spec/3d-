"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, ArrowRight, Tag, PackageOpen } from "lucide-react";
import { useCart } from "@/lib/store";
import { formatTk } from "@/lib/money";
import { Quantity } from "@/components/ui/quantity";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/bits";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import type { ProductView } from "@/lib/types";

const TAX = 0.05;

export default function CartPage() {
  const cart = useCart();
  const toast = useToast();
  const [coupon, setCoupon] = useState({ code: "", applied: null as null | { code: string; discount: number; freeShipping: boolean; description?: string } });
  const [couponState, setCouponState] = useState<"idle" | "checking">("idle");
  const [shipping, setShipping] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [suggested, setSuggested] = useState<ProductView[]>([]);

  useEffect(() => {
    fetch("/api/products?perPage=4&sort=featured&category=accessories")
      .then((r) => r.json()).then((d) => setSuggested(d.items ?? [])).catch(() => {});
  }, []);

  const subtotal = cart.subtotal;
  const standardFree = subtotal >= 5000000;
  let shipCost = shipping === "EXPRESS" ? 150000 : standardFree ? 0 : 29900;
  const discount = coupon.applied ? coupon.applied.discount : 0;
  if (coupon.applied?.freeShipping) shipCost = 0;
  const tax = Math.round(Math.max(0, subtotal - discount) * TAX);
  const total = Math.max(0, subtotal - discount + shipCost + tax);

  const applyCoupon = async () => {
    if (!coupon.code.trim()) return;
    setCouponState("checking");
    try {
      const r = await fetch("/api/coupons/validate", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: coupon.code, subtotal }),
      });
      const d = await r.json();
      if (d.valid) {
        setCoupon((c) => ({ ...c, applied: { code: d.code, discount: d.discount, freeShipping: d.freeShipping, description: d.description } }));
        toast.push({ kind: "success", title: "Coupon applied", body: d.description });
      } else {
        toast.push({ kind: "error", title: "Invalid coupon", body: d.reason ?? "This coupon can’t be used on your cart." });
      }
    } catch {
      toast.push({ kind: "error", title: "Network error" });
    } finally {
      setCouponState("idle");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-32 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-6">
        <div>
          <p className="label-tech mb-2">Checkout step 1 of 6</p>
          <h1 className="text-hero text-[clamp(2rem,5vw,3rem)]">Your cart.</h1>
        </div>
        {cart.items.length > 0 && (
          <button onClick={cart.clear} className="group flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ash transition-colors hover:text-ember">
            <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:-rotate-12" />Clear cart
          </button>
        )}
      </header>

      {cart.items.length === 0 ? (
        <div className="rounded-lg border border-white/[0.07] bg-gradient-to-b from-iron/40 to-transparent">
          <EmptyState
            illustration="cart"
            title="Your cart is waiting."
            body="Configured to order, shipped from DHK-01. Add an instrument and it holds."
            cta={<div className="flex gap-3"><ButtonLink href="/shop">Explore collection</ButtonLink><ButtonLink href="/deals" variant="outline">See live deals</ButtonLink></div>}
          />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {cart.items.map((l) => (
                <motion.li
                  key={l.variantId} layout
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30, height: 0, marginTop: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className="flex gap-4 border-b border-white/[0.06] py-5"
                >
                  <Link href={`/product/${l.slug}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-md border border-white/[0.07] bg-iron p-2.5 transition-transform hover:scale-[1.03]">
                    <img src={l.image} alt={l.name} className="h-full w-full object-contain" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/product/${l.slug}`} className="font-display text-[14.5px] font-semibold transition-colors hover:text-crimson">{l.name}</Link>
                        {l.label && <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ash">{l.label}</p>}
                        <p className="mt-1 text-[11px] text-ash">SKU {l.sku}</p>
                      </div>
                      <p className="num font-mono text-[14px]">{formatTk(l.price * l.qty)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <Quantity value={l.qty} onChange={(n) => cart.setQty(l.variantId, n)} max={l.stock} />
                      <div className="flex items-center gap-3">
                        <span className="num font-mono text-[11px] text-ash">{formatTk(l.price)} / unit</span>
                        <button onClick={() => cart.remove(l.variantId)} aria-label={`Remove ${l.name}`} className="rounded-sm p-1.5 text-ash transition-all hover:bg-ember/10 hover:text-ember active:scale-90"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <aside className="glass-deep h-fit rounded-lg p-5 lg:sticky lg:top-24">
            <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.18em]">Summary</h2>

            {/* coupon */}
            <div className="mt-4">
              {coupon.applied ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-between rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-[12px] text-emerald-300"><Tag className="h-3.5 w-3.5" />{coupon.applied.code}</span>
                  <button onClick={() => setCoupon({ code: "", applied: null })} className="text-[11px] text-ash hover:text-ember">Remove</button>
                </motion.div>
              ) : (
                <div className="flex gap-2">
                  <input value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} placeholder="Coupon code" aria-label="Coupon code"
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    className="min-w-0 flex-1 rounded-sm border border-white/12 bg-white/[0.04] px-3 py-2 font-mono text-[12px] uppercase tracking-widest outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-ash/60 focus:border-crimson/60" />
                  <Button size="md" onClick={applyCoupon} loading={couponState === "checking"} className="!h-[38px] !px-4">Apply</Button>
                </div>
              )}
              <p className="mt-2 text-[10.5px] text-ash">Try WELCOME10 · FAISTOF25 · FREESHIP</p>
            </div>

            {/* shipping choice */}
            <fieldset className="mt-4 space-y-1.5">
              <legend className="label-tech mb-1">Delivery</legend>
              {(["STANDARD", "EXPRESS"] as const).map((m) => (
                <label key={m} className={cn("flex cursor-pointer items-center justify-between rounded-sm border px-3 py-2.5 text-[12px] transition-all", shipping === m ? "border-crimson/50 bg-crimson/[0.07]" : "border-white/10 hover:border-white/25")}>
                  <span className="flex items-center gap-2.5">
                    <span className={cn("grid h-3.5 w-3.5 place-items-center rounded-full border", shipping === m ? "border-crimson" : "border-white/30")}>{shipping === m && <span className="h-1.5 w-1.5 rounded-full bg-crimson" />}</span>
                    {m === "STANDARD" ? "Standard · 2–4 days" : "Express · next day"}
                  </span>
                  <span className="num font-mono text-[11px]">{m === "STANDARD" ? (standardFree ? "FREE" : formatTk(29900)) : formatTk(150000)}</span>
                  <input type="radio" name="ship" className="sr-only" checked={shipping === m} onChange={() => setShipping(m)} />
                </label>
              ))}
            </fieldset>

            <dl className="mt-5 space-y-2 border-t border-white/[0.07] pt-4 text-[13px]">
              <Row k={`Subtotal (${cart.count})`} v={formatTk(subtotal)} />
              {discount > 0 && <Row k={`Coupon ${coupon.applied?.code}`} v={`− ${formatTk(discount)}`} accent />}
              <Row k="Shipping" v={shipCost ? formatTk(shipCost) : "FREE"} />
              <Row k="Tax (5%)" v={formatTk(tax)} />
              <div className="flex items-center justify-between border-t border-white/[0.07] pt-3">
                <dt className="font-display text-[13px] font-bold uppercase tracking-[0.14em]">Total</dt>
                <dd className="num font-mono text-[19px] font-bold"><motion.span key={total} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="inline-block">{formatTk(total)}</motion.span></dd>
              </div>
            </dl>
            <ButtonLink href="/checkout" full size="lg" className="mt-5">
              Checkout <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-ash"><PackageOpen className="h-3 w-3 text-crimson" />Cart saves locally and syncs to your account on sign-in</p>
            <button onClick={() => toast.push({ kind: "info", title: "Saved for later", body: "Checkout remembers this cart." })} className="mt-2 w-full rounded-sm border border-white/10 py-2 text-[11px] text-ash transition-colors hover:text-white">Keep cart for 7 days</button>
          </aside>
        </div>
      )}

      {suggested.length > 0 && (
        <section className="mt-16" aria-labelledby="cross-h">
          <h2 id="cross-h" className="mb-4 font-display text-lg font-bold uppercase tracking-tight">Pairs well with</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {suggested.map((p, i) => (
              <SuggestCard key={p.id} p={p} i={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ash">{k}</dt>
      <dd className={cn("num font-mono", accent ? "text-emerald-400" : "text-mist")}>{v}</dd>
    </div>
  );
}

function SuggestCard({ p, i }: { p: ProductView; i: number }) {
  const cart = useCart();
  const v = p.variants[0];
  if (!p) return <Skeleton className="h-40" />;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="group flex items-center gap-3 rounded-md border border-white/[0.07] bg-abyss/50 p-3 transition-colors hover:border-crimson/40">
      <Link href={`/product/${p.slug}`} className="h-16 w-14 shrink-0 p-1"><img src={p.image} alt="" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110" /></Link>
      <div className="min-w-0 flex-1">
        <Link href={`/product/${p.slug}`} className="block truncate font-display text-[12.5px] font-semibold hover:text-crimson">{p.name}</Link>
        <p className="num font-mono text-[11px] text-ash">{formatTk(p.basePrice)}</p>
      </div>
      <button
        disabled={!v || v.stock <= 0}
        onClick={() => v && cart.add({ variantId: v.id, productId: p.id, slug: p.slug, sku: v.sku, name: p.name, price: v.price, compareAtPrice: v.compareAtPrice, image: p.image, label: v.label, stock: v.stock })}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-white/15 text-mist transition-all hover:border-crimson hover:bg-crimson hover:text-white active:scale-90 disabled:opacity-30"
        aria-label={`Add ${p.name} to cart`}
      >
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

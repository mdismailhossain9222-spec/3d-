"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Eye, Scale, Check } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { formatTk } from "@/lib/money";
import { Badge, Rating } from "@/components/ui/bits";
import { useCart, useCompare, useWishlist } from "@/lib/store";
import { optionAxes, findVariant, priceFor } from "@/lib/variants";
import { Countdown } from "@/lib/countdown";
import { QuickView } from "@/components/product/quick-view";
import { cn } from "@/lib/utils";

export function ProductCard({ product, index = 0 }: { product: ProductView; index?: number }) {
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [color, setColor] = useState<string | null>(product.colors[0]?.key ?? null);
  const [addState, setAddState] = useState<"idle" | "loading" | "done">("idle");
  const [quick, setQuick] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const wish = useWishlist();
  const cmp = useCompare();

  const { colors } = optionAxes(product);
  const gallery = product.images.filter((i) => !i.colorKey || i.colorKey === color);
  const shown = (hovered ? gallery[Math.min(1, gallery.length - 1)] : gallery[0]) ?? product.images[0];
  const sel = findVariant(product, { color, ram: null, storage: null, size: null });
  const { price, compareAt } = priceFor(product, { color, ram: null, storage: null, size: null });
  const saved = wish.has(product.id);
  const inCompare = cmp.has(product.id);
  const out = (sel?.stock ?? 0) <= 0 && product.totalStock <= 0;

  const addToCart = async () => {
    if (!sel || sel.stock <= 0) return;
    setAddState("loading");
    await new Promise((r) => setTimeout(r, 560)); // perceptible processing beat
    const r = imgRef.current?.getBoundingClientRect();
    cart.add(
      {
        variantId: sel.id, productId: product.id, slug: product.slug, sku: sel.sku,
        name: product.name, price, compareAtPrice: compareAt, image: product.image, label: sel.label, stock: sel.stock,
      },
      1
    );
    if (r) window.dispatchEvent(new CustomEvent("fs:fly", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
    setAddState("done");
    setTimeout(() => setAddState("idle"), 1200);
  };

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border border-white/[0.07] bg-gradient-to-b from-white/[0.045] to-transparent transition-all duration-500",
        "hover:border-crimson/30 hover:shadow-crim",
        hovered && !reduce && "hover:-translate-y-1.5"
      )}
    >
      {/* image slab */}
      <Link href={`/product/${product.slug}`} aria-label={product.name} className="relative block aspect-[4/4.4] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [background:radial-gradient(60%_50%_at_50%_60%,rgba(215,25,32,0.18),transparent_70%)]" />
        <div ref={imgRef} className="absolute inset-0 p-6">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={shown?.url}
              src={shown?.url}
              alt={shown?.alt ?? product.name}
              loading="lazy"
              initial={{ opacity: 0, scale: 0.96, rotate: reduce ? 0 : -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="h-full w-full object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)]"
            />
          </AnimatePresence>
        </div>

        {/* badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.onSale && <Badge tone="crimson">On deal</Badge>}
          {product.isNew && !product.onSale && <Badge tone="outline">New</Badge>}
        </div>
        {out && (
          <div className="absolute inset-0 grid place-items-center bg-void/60 backdrop-blur-[2px]">
            <span className="label-tech !text-[10px] rounded-sm border border-white/20 px-3 py-1.5 text-mist">Sold out</span>
          </div>
        )}

        {/* hover actions */}
        <div className="absolute right-3 top-3 flex translate-x-10 flex-col gap-1.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <IconBtn
            label={saved ? "Remove from wishlist" : "Save to wishlist"}
            active={saved}
            onClick={(e) => {
              e.preventDefault();
              const res = wish.toggle({ productId: product.id, slug: product.slug, name: product.name, price, image: product.image });
              (e.currentTarget as HTMLElement).dataset.state = res;
            }}
          >
            <motion.span animate={saved ? { scale: [1, 1.5, 0.8, 1.15, 1] } : { scale: [1, 0.8, 1] }} transition={{ duration: 0.45 }} className="block">
              <Heart className={cn("h-4 w-4", saved && "fill-crimson text-crimson")} />
            </motion.span>
          </IconBtn>
          <IconBtn label={inCompare ? "Remove from compare" : "Add to compare"} active={inCompare} onClick={(e) => { e.preventDefault(); cmp.toggle({ productId: product.id, slug: product.slug, name: product.name }); }}>
            <Scale className="h-4 w-4" />
          </IconBtn>
          <IconBtn label="Quick view" onClick={(e) => { e.preventDefault(); setQuick(true); }}>
            <Eye className="h-4 w-4" />
          </IconBtn>
        </div>
      </Link>

      {/* meta */}
      <div className="flex flex-1 flex-col gap-2.5 border-t border-white/[0.06] bg-abyss/40 px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/product/${product.slug}`} className="font-display text-[15px] font-semibold tracking-wide transition-colors hover:text-crimson">
              {product.name}
            </Link>
            <p className="mt-0.5 truncate text-[11.5px] leading-snug text-ash">{product.tagline}</p>
          </div>
          {product.deal && (
            <div className="shrink-0 rounded-[3px] border border-crimson/25 bg-crimson/[0.08] px-1.5 py-1">
              <Countdown endsAt={product.deal.endsAt} compact />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Rating value={product.ratingAverage} count={product.ratingCount} />
          <div className="flex items-center gap-1.5" role="group" aria-label="Colors">
            {colors.map((c) => (
              <button
                key={c.key}
                aria-label={c.label}
                aria-pressed={color === c.key}
                onClick={() => setColor(c.key)}
                className={cn(
                  "h-4 w-4 rounded-full border transition-all duration-200 hover:scale-125",
                  color === c.key ? "scale-110 border-crimson ring-2 ring-crimson/30 ring-offset-2 ring-offset-abyss" : "border-white/25"
                )}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <p className="num font-mono text-[14px] font-medium text-snow">
            {formatTk(price)}
            {compareAt && compareAt > price && <span className="ml-2 text-[11px] text-ash line-through decoration-crimson/60">{formatTk(compareAt)}</span>}
          </p>
          <button
            onClick={addToCart}
            disabled={out || addState === "loading"}
            className={cn(
              "relative flex h-8 items-center gap-1.5 overflow-hidden rounded-sm px-3.5 font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 active:scale-95",
              out ? "cursor-not-allowed bg-white/[0.06] text-ash"
              : addState === "done" ? "bg-emerald-500/90 text-white"
              : "bg-gradient-to-b from-crimson to-[#a80f15] text-white hover:from-ember shadow-crim/50"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {addState === "loading" ? (
                <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
                  Adding
                </motion.span>
              ) : addState === "done" ? (
                <motion.span key="d" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8 }} transition={{ type: "spring", stiffness: 500, damping: 26 }} className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Added
                </motion.span>
              ) : (
                <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {out ? "Sold out" : "Add to cart"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      <QuickView product={product} open={quick} onClose={() => setQuick(false)} />
    </motion.article>
  );
}

function IconBtn({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "glass grid h-9 w-9 place-items-center rounded-full text-mist transition-all duration-200 hover:scale-110 hover:border-crimson/50 hover:text-white active:scale-95",
        active && "border-crimson/60 text-crimson"
      )}
    >
      {children}
    </button>
  );
}

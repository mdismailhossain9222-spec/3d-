"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge, Rating } from "@/components/ui/bits";
import { Quantity } from "@/components/ui/quantity";
import { ButtonLink } from "@/components/ui/button";
import { formatTk } from "@/lib/money";
import { optionAxes, findVariant } from "@/lib/variants";
import { useCart } from "@/lib/store";
import type { ProductView } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuickView({ product, open, onClose }: { product: ProductView; open: boolean; onClose: () => void }) {
  const cart = useCart();
  const [color, setColor] = useState<string | null>(product.colors[0]?.key ?? null);
  const [ram, setRam] = useState<number | null>(null);
  const [storage, setStorage] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const { colors, ramOptions, storageOptions } = optionAxes(product);

  const sel = useMemo(
    () => findVariant(product, { color, ram: ram ?? product.specs.flat.ramGb ?? null, storage, size: null }),
    [product, color, ram, storage]
  );
  const image = product.images.find((i) => i.colorKey === color) ?? product.images[0];
  const inCart = sel ? cart.has(sel.id) : false;

  const add = async () => {
    if (!sel || sel.stock <= 0) return;
    setState("loading");
    await new Promise((r) => setTimeout(r, 520));
    cart.add(
      {
        variantId: sel.id, productId: product.id, slug: product.slug, sku: sel.sku, name: product.name,
        price: sel.price, compareAtPrice: sel.compareAtPrice, image: product.image, label: sel.label, stock: sel.stock,
      },
      qty
    );
    setState("done");
    setTimeout(() => setState("idle"), 1400);
  };

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()} title="Quick view" wide>
      <div className="grid gap-6 md:grid-cols-[1.05fr_1fr]">
        <div className="relative overflow-hidden rounded-md bg-gradient-to-b from-iron to-abyss p-4">
          <div className="pointer-events-none absolute inset-0 crimson-atmosphere opacity-60" />
          <AnimatePresence mode="popLayout">
            <motion.img
              key={image?.url}
              src={image?.url}
              alt={product.name}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto max-h-[340px] w-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.9)]"
            />
          </AnimatePresence>
          {product.onSale && <div className="absolute left-3 top-3"><Badge tone="crimson">Deal price</Badge></div>}
        </div>

        <div className="flex flex-col">
          <p className="label-tech mb-1">{product.categoryName}</p>
          <h3 className="font-display text-2xl font-bold tracking-tight">{product.name}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ash">{product.tagline}</p>
          <div className="mt-3 flex items-center gap-3">
            <Rating value={product.ratingAverage} count={product.ratingCount} />
            <span className="text-[11px] text-ash">·</span>
            <Link href={`/product/${product.slug}#reviews`} className="text-[11px] text-crimson hover:underline">Read reviews</Link>
          </div>

          <p className="num mt-4 font-mono text-[20px] font-semibold">
            {sel ? formatTk(sel.price) : `from ${formatTk(product.basePrice)}`}
            {sel?.compareAtPrice && sel.compareAtPrice > sel.price && (
              <span className="ml-2 text-[12px] font-normal text-ash line-through">{formatTk(sel.compareAtPrice)}</span>
            )}
          </p>

          {/* color */}
          <fieldset className="mt-5">
            <legend className="label-tech mb-2">Finish · {colors.find((c) => c.key === color)?.label}</legend>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setColor(c.key)}
                  aria-label={`${c.label}${c.priceDelta ? ` (+${formatTk(c.priceDelta)})` : ""}`}
                  className={cn(
                    "relative h-8 w-8 rounded-full border transition-all hover:scale-110",
                    color === c.key ? "border-crimson ring-2 ring-crimson/35 ring-offset-2 ring-offset-carbon" : "border-white/25"
                  )}
                  style={{ background: c.hex }}
                >
                  {!c.inStock && <span className="absolute inset-0 rounded-full bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.35)_4px)]" />}
                </button>
              ))}
            </div>
          </fieldset>

          {/* memory */}
          {ramOptions.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <fieldset>
                <legend className="label-tech mb-2">RAM</legend>
                <div className="flex flex-wrap gap-1.5">
                  {ramOptions.map((r) => (
                    <Chip key={r} active={ram === r || (ram == null && product.specs.flat.ramGb === r)} onClick={() => setRam(r)}>{r}GB</Chip>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label-tech mb-2">Storage</legend>
                <div className="flex flex-wrap gap-1.5">
                  {storageOptions.map((s) => (
                    <Chip key={s} active={storage === s} onClick={() => setStorage(s)}>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</Chip>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between rounded-md border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5">
            <div>
              <p className="text-[11px] text-ash">Configuration</p>
              <p className="font-mono text-[12px] text-mist">{sel?.label ?? "Standard"}</p>
            </div>
            <Quantity value={qty} onChange={setQty} max={Math.max(1, sel?.stock ?? 1)} />
          </div>
          {sel && sel.stock > 0 && sel.stock <= 8 && (
            <p className="mt-2 text-right text-[11px] text-amber-400/90">Only {sel.stock} left for this configuration</p>
          )}

          <div className="mt-4 flex gap-2.5">
            <button
              onClick={add}
              disabled={!sel || sel.stock <= 0 || state === "loading"}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-2 rounded-sm font-display text-[12px] font-semibold uppercase tracking-[0.14em] transition-all active:scale-[0.98]",
                state === "done" ? "bg-emerald-500 text-white" : "bg-gradient-to-b from-crimson to-[#a80f15] text-white shadow-crim hover:from-ember disabled:opacity-40"
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {state === "loading" ? (
                  <motion.span key="l" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Adding…
                  </motion.span>
                ) : state === "done" ? (
                  <motion.span key="d" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2"><Check className="h-4 w-4" /> Added to cart</motion.span>
                ) : (
                  <motion.span key="i" exit={{ opacity: 0 }}>{inCart ? "In cart — add again" : sel && sel.stock <= 0 ? "Sold out" : "Add to cart"}</motion.span>
                )}
              </AnimatePresence>
            </button>
            <ButtonLink href={`/product/${product.slug}`} variant="outline" size="lg" className="!h-11" onClick={onClose}>
              Full details <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative rounded-sm border px-2.5 py-1.5 font-mono text-[11px] tracking-wide transition-all duration-200 active:scale-95",
        active
          ? "border-crimson/70 bg-crimson/15 text-white"
          : "border-white/12 bg-white/[0.03] text-ash hover:border-white/30 hover:text-mist"
      )}
    >
      {children}
    </button>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import {
  Heart, Scale, Truck, ShieldCheck, Star, ChevronRight, Rotate3d, Check,
} from "lucide-react";
import type { ProductView, ReviewView } from "@/lib/types";
import { formatTk } from "@/lib/money";
import { Badge, Rating, TabBar, SectionHead } from "@/components/ui/bits";
import { Quantity } from "@/components/ui/quantity";
import { Chip } from "@/components/product/quick-view";
import { optionAxes, findVariant, priceFor } from "@/lib/variants";
import { useCart, useCompare, useWishlist } from "@/lib/store";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { Countdown } from "@/lib/countdown";
import { ProductCard } from "@/components/product/product-card";

export function ProductExperience({ product, reviews, related, initialColor, canReview }: {
  product: ProductView;
  reviews: ReviewView[];
  related: ProductView[];
  initialColor?: string | null;
  canReview?: boolean;
}) {
  const cart = useCart();
  const wish = useWishlist();
  const cmp = useCompare();
  const toast = useToast();

  const { colors, ramOptions, storageOptions, sizeOptions } = optionAxes(product);
  const [color, setColor] = useState<string | null>(
    initialColor && colors.some((c) => c.key === initialColor) ? initialColor : colors[0]?.key ?? null
  );
  const [ram, setRam] = useState<number | null>(null);
  const [storage, setStorage] = useState<number | null>(null);
  const [size, setSize] = useState<string | null>(sizeOptions[0] ?? null);
  const [qty, setQty] = useState(1);
  const [addState, setAddState] = useState<"idle" | "loading" | "done">("idle");

  const sel = useMemo(() => findVariant(product, { color, ram: ram ?? product.specs.flat.ramGb ?? null, storage, size }), [product, color, ram, storage, size]);
  const { price, compareAt } = priceFor(product, { color, ram, storage, size });
  const gallery = product.images.filter((i) => !i.colorKey || i.colorKey === color);
  const [activeImg, setActiveImg] = useState(0);
  const shownImg = gallery[Math.min(activeImg, gallery.length - 1)] ?? product.images[0];
  const saved = wish.has(product.id);

  // ── gallery tilt + zoom ──
  const rx = useSpring(useMotionValue(0), { stiffness: 160, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 160, damping: 20 });
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  const onMove = (e: React.MouseEvent) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 14);
    rx.set(-py * 10);
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const selectVariant = () => sel && sel.stock > 0;

  const addToCart = async () => {
    if (!sel) return;
    if (!selectVariant()) { toast.push({ kind: "warning", title: "Sold out", body: "This configuration is between batches." }); return; }
    setAddState("loading");
    await new Promise((r) => setTimeout(r, 620));
    cart.add({ variantId: sel.id, productId: product.id, slug: product.slug, sku: sel.sku, name: product.name, price: sel.price, compareAtPrice: sel.compareAtPrice, image: product.image, label: sel.label, stock: sel.stock }, qty);
    const r = stageRef.current?.getBoundingClientRect();
    if (r) window.dispatchEvent(new CustomEvent("fs:fly", { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
    setAddState("done");
    setTimeout(() => setAddState("idle"), 1400);
  };

  const eta = useMemo(() => {
    const d = new Date(Date.now() + (sel?.stock ? 3 : 6) * 86400000);
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  }, [sel]);

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pt-24 md:px-8">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ash">
        <Link href="/" className="transition-colors hover:text-white">Home</Link><ChevronRight className="h-3 w-3" />
        <Link href={`/${product.categorySlug === "accessories" ? "accessories" : "phones"}`} className="transition-colors hover:text-white">{product.categoryName}</Link><ChevronRight className="h-3 w-3" />
        <span className="text-mist">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* ── gallery ── */}
        <div className="min-w-0">
          <div className="lg:sticky lg:top-24">
            <div
              ref={stageRef}
              onMouseMove={onMove}
              onMouseLeave={() => { rx.set(0); ry.set(0); setZoom(false); }}
              onClick={() => setZoom((z) => !z)}
              role="img"
              aria-label={`${product.name} — ${shownImg.alt}`}
              className="group relative aspect-[4/3.4] cursor-zoom-in overflow-hidden rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#101013] to-[#060607] select-none md:aspect-[4/3.2]"
              style={{ perspective: 900 }}
            >
              <div className="pointer-events-none absolute inset-0 crimson-atmosphere opacity-50 transition-opacity duration-500 group-hover:opacity-80" />
              <motion.div style={{ rotateX: rx, rotateY: ry }} className="absolute inset-0 grid place-items-center p-8">
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={shownImg.url}
                    src={shownImg.url}
                    alt={shownImg.alt}
                    draggable={false}
                    initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: zoom ? 1.75 : 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="max-h-full max-w-full object-contain drop-shadow-[0_45px_60px_rgba(0,0,0,0.85)]"
                    style={{ transformOrigin: origin }}
                  />
                </AnimatePresence>
              </motion.div>
              <span className="label-tech absolute left-4 top-4 flex items-center gap-1.5 !text-[9px]"><Rotate3d className="h-3 w-3 text-crimson" />TILT · CLICK TO {zoom ? "RESET" : "ZOOM"}</span>
              <span className="num absolute bottom-4 right-4 font-mono text-[10px] text-ash">0{activeImg + 1} / 0{Math.max(1, gallery.length)}</span>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {gallery.map((g, i) => (
                <button
                  key={g.url + i}
                  onClick={() => setActiveImg(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={i === Math.min(activeImg, gallery.length - 1)}
                  className={cn("relative h-20 w-16 shrink-0 overflow-hidden rounded-md border bg-iron p-2 transition-all", i === Math.min(activeImg, gallery.length - 1) ? "border-crimson/70" : "border-white/10 opacity-60 hover:opacity-100")}
                >
                  <img src={g.url} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── buy panel ── */}
        <div className="min-w-0 pb-10">
          <div className="flex flex-wrap items-center gap-2">
            {product.badge && <Badge tone="crimson">{product.badge}</Badge>}
            {product.isNew && <Badge tone="outline">New</Badge>}
            {product.onSale && <Badge tone="warn">Deal price</Badge>}
            {product.totalStock <= 0 && <Badge tone="neutral">Between batches</Badge>}
          </div>

          <h1 className="mt-4 font-display text-[clamp(1.9rem,4.5vw,2.9rem)] font-bold uppercase leading-none tracking-tight">{product.name}</h1>
          <p className="mt-2 text-[14px] text-ash">{product.tagline}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <a href="#reviews" className="transition-transform hover:scale-105"><Rating value={product.ratingAverage} count={product.ratingCount} size={14} /></a>
            <span className="text-[11px] text-ash">·</span>
            <Link href="#specs" className="font-mono text-[11px] uppercase tracking-widest text-crimson hover:underline">Full specs</Link>
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-3">
            <AnimatePresence mode="popLayout">
              <motion.p key={price} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="num font-mono text-[26px] font-semibold leading-none">
                {formatTk(price)}
              </motion.p>
            </AnimatePresence>
            {compareAt && compareAt > price && (
              <p className="num pb-1 font-mono text-[13px] text-ash line-through decoration-crimson/70">{formatTk(compareAt)}</p>
            )}
            {product.deal && !product.deal.title.includes("Bundle") && (
              <span className="mb-1 flex items-center gap-2 rounded-sm border border-crimson/30 bg-crimson/[0.08] px-2 py-1">
                <span className="label-tech !text-[8px] !tracking-[0.18em]">Ends</span><Countdown endsAt={product.deal.endsAt} />
              </span>
            )}
          </div>
          <p className="mt-1 text-[10.5px] text-ash">Inclusive of all taxes · EMI from {formatTk(Math.round(price / 6))}/mo × 6</p>

          <p className="mt-5 text-[13.5px] leading-relaxed text-ash">{product.description}</p>

          {/* color */}
          <fieldset className="mt-7">
            <legend className="label-tech mb-2.5 flex w-full items-center justify-between">
              <span>Finish</span>
              <span className="!normal-case !tracking-normal font-sans text-[11px] text-mist">{colors.find((c) => c.key === color)?.label}</span>
            </legend>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((c) => (
                <button
                  key={c.key}
                  onClick={() => { setColor(c.key); setActiveImg(0); }}
                  aria-label={`${c.label}${c.priceDelta ? ` plus ${formatTk(c.priceDelta)}` : ""}`}
                  aria-pressed={color === c.key}
                  className={cn("group relative h-9 w-9 rounded-full border transition-all duration-200 hover:scale-110", color === c.key ? "scale-105 border-crimson ring-2 ring-crimson/35 ring-offset-2 ring-offset-void" : "border-white/25")}
                  style={{ background: c.hex }}
                >
                  {!c.inStock && <span className="absolute inset-0 rounded-full bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.4)_4px)]" />}
                </button>
              ))}
            </div>
          </fieldset>

          {/* memory */}
          {ramOptions.length > 0 && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <fieldset>
                <legend className="label-tech mb-2">Memory</legend>
                <div className="flex flex-wrap gap-1.5">
                  {ramOptions.map((r) => <Chip key={r} active={(ram ?? product.specs.flat.ramGb) === r} onClick={() => setRam(r)}>{r}GB</Chip>)}
                </div>
              </fieldset>
              <fieldset>
                <legend className="label-tech mb-2">Storage</legend>
                <div className="flex flex-wrap gap-1.5">
                  {storageOptions.map((s) => <Chip key={s} active={storage === s} onClick={() => setStorage(s)}>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</Chip>)}
                </div>
              </fieldset>
            </div>
          )}
          {sizeOptions.length > 0 && (
            <fieldset className="mt-5">
              <legend className="label-tech mb-2">Fitment</legend>
              <div className="flex flex-wrap gap-1.5">
                {sizeOptions.map((s) => <Chip key={s} active={size === s} onClick={() => setSize(s)}>{s}</Chip>)}
              </div>
            </fieldset>
          )}

          {/* stock + qty + cta */}
          <div className="mt-7 rounded-lg border border-white/[0.08] bg-abyss/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] text-ash">Selected: <span className="text-mist">{sel?.label ?? "—"}</span></p>
                <p className={cn("mt-1 flex items-center gap-1.5 text-[12px]", sel?.stock === 0 ? "text-ember" : sel && sel.stock <= 8 ? "text-amber-300" : "text-emerald-400")}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-crim" />
                  {sel?.stock === 0 ? "Out of stock · restock announced by email" : sel && sel.stock <= 8 ? `Only ${sel.stock} left` : `In stock · ${sel?.stock} units at DHK-01`}
                </p>
              </div>
              <Quantity value={qty} onChange={setQty} max={Math.max(1, sel?.stock ?? 1)} />
            </div>
            <div className="mt-4 flex gap-2.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={addToCart}
                disabled={addState === "loading" || !sel || sel.stock <= 0}
                className={cn(
                  "relative flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-sm font-display text-[12.5px] font-semibold uppercase tracking-[0.16em] transition-all",
                  addState === "done" ? "bg-emerald-500 text-white" : "bg-gradient-to-b from-crimson to-[#9d0f15] text-white shadow-crim hover:from-ember disabled:opacity-40"
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {addState === "loading" ? (
                    <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Securing your unit…</motion.span>
                  ) : addState === "done" ? (
                    <motion.span key="d" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Check className="h-4 w-4" />Added to cart</motion.span>
                  ) : (
                    <motion.span key="i" exit={{ opacity: 0 }}>{sel && sel.stock <= 0 ? "Notify me" : `Add to cart · ${formatTk(price * qty)}`}</motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
              <button
                aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                onClick={() => wish.toggle({ productId: product.id, slug: product.slug, name: product.name, price, image: product.image, label: sel?.label })}
                className={cn("grid h-12 w-12 place-items-center rounded-sm border transition-all active:scale-90", saved ? "border-crimson/60 bg-crimson/15 text-crimson" : "border-white/15 text-mist hover:border-crimson/50 hover:text-crimson")}
              >
                <motion.span animate={saved ? { scale: [1, 1.4, 0.85, 1.1, 1] } : { scale: [1, 0.85, 1] }} transition={{ duration: 0.45 }}><Heart className={cn("h-5 w-5", saved && "fill-crimson")} /></motion.span>
              </button>
              <button
                aria-label="Add to compare"
                onClick={() => {
                  const r = cmp.toggle({ productId: product.id, slug: product.slug, name: product.name });
                  if (r === "full") toast.push({ kind: "warning", title: "Compare is full", body: "Remove one to add another (max 4)." });
                }}
                className={cn("grid h-12 w-12 place-items-center rounded-sm border transition-all active:scale-90", cmp.has(product.id) ? "border-crimson/60 bg-crimson/15 text-crimson" : "border-white/15 text-mist hover:border-crimson/50")}
              >
                <Scale className="h-5 w-5" />
              </button>
            </div>
          </div>

          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {[
              { icon: <Truck className="h-4 w-4" />, t: `Arrives ${eta}`, s: sel?.stock ? "Free insured courier over ৳50,000" : "Pre-order window opens soon" },
              { icon: <ShieldCheck className="h-4 w-4" />, t: "2-year FAISTOF warranty", s: "Accident cover add-on at checkout" },
            ].map((x) => (
              <li key={x.t} className="glass flex items-start gap-3 rounded-md p-3.5">
                <span className="mt-0.5 text-crimson">{x.icon}</span>
                <span><span className="block text-[12.5px] font-medium">{x.t}</span><span className="mt-0.5 block text-[11px] text-ash">{x.s}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── highlights band ── */}
      {product.highlights.length > 0 && (
        <div className="mt-6 grid gap-3 border-y border-white/[0.06] py-6 sm:grid-cols-2 lg:grid-cols-4">
          {product.highlights.map((h, i) => (
            <motion.p key={h} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }} className="flex items-center gap-2.5 text-[12.5px] text-mist">
              <span className="h-1 w-1 rounded-full bg-crimson" />{h}
            </motion.p>
          ))}
        </div>
      )}

      {/* ── detail story ── */}
      {(product.specs.flat.displaySize ?? 0) >= 6 && (
        <section className="relative mt-24" aria-label="Design details">
          <SectionHead kicker="Craft" title="Made of arguments,<br />settled in titanium." sub="The render gallery below is the same photography language the configurator uses — because the object deserves it." />
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              { img: "/renders/macro-camera.jpg", t: "The island", b: "Sapphire over a 7-element stack, flush to 0.02mm." },
              { img: "/renders/macro-frame.jpg", t: "The frame", b: "Forged, bead-blasted, vapour-polished. Click: 0.35mm of truth." },
              { img: "/renders/angle-obsidian.jpg", t: "The posture", b: "Weight biased to the hinge side for one-hand honesty." },
            ].map((c, i) => (
              <motion.div key={c.t} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="group relative overflow-hidden rounded-lg border border-white/[0.07]">
                <img src={c.img} alt={c.t} className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                <div className="absolute bottom-0 p-5">
                  <p className="font-display text-[15px] font-semibold uppercase tracking-wide">{c.t}</p>
                  <p className="mt-1 max-w-[38ch] text-[12px] text-ash">{c.b}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── specs ── */}
      {product.specs.groups.length > 0 && <SpecsBlock product={product} />}

      {/* ── reviews ── */}
      <ReviewsBlock product={product} reviews={reviews} canReview={canReview} />

      {/* ── related ── */}
      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="rel-h">
          <SectionHead kicker="Pairs with" title={<span id="rel-h">Complete the system.</span>} right={<Link href="/shop" className="font-mono text-[11px] uppercase tracking-[0.18em] text-crimson hover:underline">All products →</Link>} />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* ── mobile sticky CTA ── */}
      <MobileBuyBar price={price} onAdd={addToCart} state={addState} name={product.name} />
    </div>
  );
}

function SpecsBlock({ product }: { product: ProductView }) {
  const groups = product.specs.groups;
  const [tab, setTab] = useState(groups[0]?.group ?? "");
  const cur = groups.find((g) => g.group === tab) ?? groups[0];
  return (
    <section id="specs" className="mt-24 scroll-mt-24" aria-labelledby="specs-h">
      <SectionHead kicker="Technical" title={<span id="specs-h">The full record.</span>} sub="Every number below is what ships — no asterisk class, no lab-only footnote." />
      <div className="mt-8 flex flex-wrap gap-2">
        {groups.map((g) => (
          <button key={g.group} onClick={() => setTab(g.group)} className={cn("rounded-full border px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-all", tab === g.group ? "border-crimson/60 bg-crimson/15 text-white" : "border-white/12 text-ash hover:border-white/30 hover:text-mist")}>
            {g.group}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.dl
          key={cur?.group}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}
          className="mt-4 overflow-hidden rounded-lg border border-white/[0.07]"
        >
          {(cur?.items ?? []).map((row, i) => (
            <div key={row.label} className={cn("grid grid-cols-[130px_1fr] gap-4 px-5 py-3.5 text-[13px] transition-colors hover:bg-white/[0.03]", i % 2 ? "bg-white/[0.015]" : "bg-transparent")}>
              <dt className="label-tech !normal-case !tracking-[0.06em] !text-[11px] !text-ash">{row.label}</dt>
              <dd className="text-mist">{row.value}</dd>
            </div>
          ))}
        </motion.dl>
      </AnimatePresence>
    </section>
  );
}

function ReviewsBlock({ product, reviews, canReview }: { product: ProductView; reviews: ReviewView[]; canReview?: boolean }) {
  const [tab, setTab] = useState("all");
  const list = reviews.filter((r) => tab === "all" || r.rating === Number(tab));
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: reviews.filter((r) => r.rating === star).length }));
  const max = Math.max(1, ...dist.map((d) => d.n));

  return (
    <section id="reviews" className="mt-24 scroll-mt-24" aria-labelledby="rev-h">
      <SectionHead kicker="Owner reports" title={<span id="rev-h">People who own it.</span>} right={<Rating value={product.ratingAverage} count={product.ratingCount} size={15} />} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="glass-deep h-fit rounded-lg p-5">
          <p className="num font-display text-5xl font-bold">{product.ratingAverage.toFixed(1)}</p>
          <div className="mt-2"><Rating value={product.ratingAverage} /></div>
          <p className="mt-1 text-[11px] text-ash">Based on {product.ratingCount} ratings · {reviews.length} written here</p>
          <ul className="mt-4 space-y-1.5">
            {dist.map((d) => (
              <li key={d.star}>
                <button onClick={() => setTab(tab === String(d.star) ? "all" : String(d.star))} className="group flex w-full items-center gap-2 text-left">
                  <span className="num flex w-8 items-center gap-0.5 font-mono text-[11px] text-ash group-hover:text-white">{d.star}<Star className="h-2.5 w-2.5 fill-current text-ember" strokeWidth={0} /></span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <span className="block h-full rounded-full bg-gradient-to-r from-[#8e0f14] to-crimson transition-all duration-500" style={{ width: `${(d.n / max) * 100}%` }} />
                  </span>
                  <span className="num w-5 text-right font-mono text-[10.5px] text-ash">{d.n}</span>
                </button>
              </li>
            ))}
          </ul>
          <WriteReview productId={product.id} authed={canReview} />
        </div>
        <div>
          <div className="mb-4 flex items-center gap-2">
            <TabBar idPrefix="rev" tabs={[{ key: "all", label: "All" }, ...[5, 4, 3].map((s) => ({ key: String(s), label: `${s}★` }))]} active={tab} onChange={setTab} />
          </div>
          {list.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 p-8 text-center text-[13px] text-ash">No reviews at this rating yet.</p>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {list.map((r, i) => (
                  <motion.li key={r.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                    <article className="rounded-lg border border-white/[0.07] bg-abyss/50 p-5 transition-colors hover:border-white/15">
                      <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b from-crimson/80 to-[#7c0c11] font-mono text-[11px] font-bold">{r.authorName.slice(0, 1)}</span>
                        <span className="font-display text-[13px] font-semibold">{r.authorName}</span>
                        {r.verified && <Badge tone="success">Verified owner</Badge>}
                        <span className="num ml-auto font-mono text-[10.5px] text-ash">{new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </header>
                      <div className="mt-3 flex items-center gap-2.5">
                        <Rating value={r.rating} size={11} />
                        <h4 className="font-display text-[14px] font-semibold tracking-wide">“{r.title}”</h4>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-ash">{r.body}</p>
                      <button onClick={() => fetch("/api/reviews", { method: "PATCH", body: JSON.stringify({ id: r.id }) })} className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ash transition-colors hover:text-crimson">Helpful · {r.helpful}</button>
                    </article>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export function WriteReview({ productId, authed }: { productId: string; authed: boolean | undefined }) {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending">("idle");
  const toast = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      const r = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId, rating: stars, title, body }) });
      const d = await r.json();
      if (d.ok) {
        toast.push({ kind: "success", title: "Review submitted", body: "It appears once our team approves it." });
        setOpen(false); setTitle(""); setBody("");
      } else {
        toast.push({ kind: "error", title: "Could not submit", body: d.error });
      }
    } catch {
      toast.push({ kind: "error", title: "Network error", body: "Try again." });
    } finally { setState("idle"); }
  };

  if (authed === false) {
    return (
      <p className="mt-5 border-t border-white/[0.07] pt-4 text-[12px] text-ash">
        <Link href="/login?next=/account" className="text-crimson hover:underline">Sign in</Link> to write a review.
      </p>
    );
  }
  return (
    <div className="mt-5 border-t border-white/[0.07] pt-4">
      {open ? (
        <form onSubmit={submit} className="space-y-2.5">
          <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <button type="button" key={s} role="radio" aria-checked={stars === s} onClick={() => setStars(s)} className="p-0.5">
                <Star className={cn("h-5 w-5 transition-all", s <= stars ? "scale-110 fill-ember text-ember" : "text-ash hover:text-mist")} />
              </button>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} placeholder="Headline" aria-label="Review headline" className="w-full rounded-sm border border-white/12 bg-white/[0.04] px-3 py-2 text-[12.5px] outline-none focus:border-crimson/70" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={10} placeholder="What surprised you in week one?" aria-label="Review body" className="h-20 w-full resize-none rounded-sm border border-white/12 bg-white/[0.04] px-3 py-2 text-[12.5px] outline-none focus:border-crimson/70" />
          <div className="flex gap-2">
            <button type="submit" disabled={state === "sending"} className="flex-1 rounded-sm bg-crimson py-2 font-display text-[11px] font-semibold uppercase tracking-[0.14em] transition-all hover:bg-ember active:scale-[0.98] disabled:opacity-50">
              {state === "sending" ? "Sending…" : "Submit for review"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-sm border border-white/12 px-3 py-2 text-[11px] text-ash transition-colors hover:text-white">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setOpen(true)} className="w-full rounded-sm border border-dashed border-white/15 py-2.5 text-[12px] text-mist transition-colors hover:border-crimson/50 hover:text-white">
          + Write a review
        </button>
      )}
    </div>
  );
}

function MobileBuyBar({ price, onAdd, state, name }: { price: number; onAdd: () => void; state: string; name: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 520);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 90 }} animate={{ y: 0 }} exit={{ y: 90 }} transition={{ type: "spring", stiffness: 340, damping: 30 }}
          className="glass-deep fixed inset-x-3 bottom-3 z-[110] flex items-center gap-3 rounded-md p-3 shadow-lift lg:hidden"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11.5px] font-medium">{name}</p>
            <p className="num font-mono text-[12px] text-crimson">{formatTk(price)}</p>
          </div>
          <button onClick={onAdd} disabled={state === "loading"} className="h-10 shrink-0 rounded-sm bg-gradient-to-b from-crimson to-[#9d0f15] px-5 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-crim active:scale-95 disabled:opacity-60">
            {state === "done" ? "Added ✓" : state === "loading" ? "…" : "Add to cart"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


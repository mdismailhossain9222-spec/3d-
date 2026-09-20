"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, Check } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { formatTk } from "@/lib/money";
import { Rating, Badge, EmptyState } from "@/components/ui/bits";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store";
import { cn } from "@/lib/utils";

type Row = { label: string; get: (p: ProductView) => string | number; better?: "max" | "min"; display?: (v: string | number) => string };

export function CompareBoard({ initial, all }: { initial: ProductView[]; all: ProductView[] }) {
  const [items, setItems] = useState<ProductView[]>(initial);
  const [picker, setPicker] = useState(false);
  const cart = useCart();

  const rows: Row[] = useMemo(() => [
    { label: "Price", get: (p) => p.basePrice, better: "min", display: (v) => formatTk(Number(v)) },
    { label: "Rating", get: (p) => p.ratingAverage, better: "max", display: (v) => `${Number(v).toFixed(1)}★` },
    { label: "Display", get: (p) => p.specs.flat.displaySize ?? "", better: "max", display: (v) => (v ? `${v}\" LumenCore` : "—") },
    { label: "Refresh", get: (p) => p.specs.flat.refreshHz ?? 0, better: "max", display: (v) => (v ? `${v}Hz` : "—") },
    { label: "Peak brightness", get: (p) => p.specs.flat.nits ?? 0, better: "max", display: (v) => (v ? `${v} nits` : "—") },
    { label: "Processor", get: (p) => p.specs.flat.chip ?? "—", display: (v) => String(v) },
    { label: "RAM", get: (p) => p.specs.flat.ramGb ?? 0, better: "max", display: (v) => (v ? `${v}GB` : "—") },
    { label: "Max storage", get: (p) => p.specs.flat.storageMaxGb ?? 0, better: "max", display: (v) => (v ? (Number(v) >= 1024 ? `${Number(v) / 1024}TB` : `${v}GB`) : "—") },
    { label: "Main camera", get: (p) => p.specs.flat.mainCameraMP ?? 0, better: "max", display: (v) => (v ? `${v}MP` : "—") },
    { label: "Battery", get: (p) => p.specs.flat.batteryMah ?? 0, better: "max", display: (v) => (v ? `${v}mAh` : "—") },
    { label: "Wired charging", get: (p) => p.specs.flat.wiredChargeW ?? 0, better: "max", display: (v) => (v ? `${v}W` : "—") },
    { label: "Wireless", get: (p) => p.specs.flat.wirelessChargeW ?? 0, better: "max", display: (v) => (v ? `${v}W` : "—") },
    { label: "Weight", get: (p) => p.specs.flat.weightG ?? 0, better: "min", display: (v) => (v ? `${v}g` : "—") },
    { label: "Ingress", get: (p) => p.specs.flat.ip ?? "—", display: (v) => String(v) },
    { label: "Software", get: (p) => p.specs.flat.os ?? "—", display: (v) => String(v) },
    { label: "In stock", get: (p) => p.totalStock, better: "max", display: (v) => (Number(v) > 0 ? `${v} units` : "Sold out") },
  ], []);

  const bestFor = (row: Row) => {
    if (!row.better || items.length < 2) return null;
    const vals = items.map((p) => Number(row.get(p)) || 0);
    const best = row.better === "max" ? Math.max(...vals) : Math.min(...vals.filter((v) => v > 0) || vals);
    if (!Number.isFinite(best)) return null;
    return best;
  };

  const toggleAdd = (p: ProductView) => {
    setItems((cur) => cur.some((x) => x.id === p.id) ? cur.filter((x) => x.id !== p.id) : [...cur, p].slice(-4));
  };

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.07] pb-6">
        <div>
          <p className="label-tech mb-2">Compare · up to four</p>
          <h1 className="text-hero text-[clamp(2rem,5vw,3rem)]">Line them up.</h1>
        </div>
        {items.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPicker(true)}><Plus className="h-3.5 w-3.5" />{items.length < 4 ? "Add device" : "Swap"}</Button>
            <Button variant="ghost" onClick={() => setItems([])}>Clear</Button>
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState
          illustration="search"
          title="Nothing side by side yet."
          body="Pick up to four devices — we align the numbers and mark the leader in each row."
          cta={<Button onClick={() => setPicker(true)}><Plus className="h-3.5 w-3.5" />Choose products</Button>}
        />
      ) : (
        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                <th className="w-40" />
                <AnimatePresence>
                  {items.map((p) => (
                    <motion.th key={p.id} initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="min-w-[220px] px-3 pb-4 align-top">
                      <div className="glass-deep relative rounded-lg p-4">
                        <button onClick={() => setItems((c) => c.filter((x) => x.id !== p.id))} aria-label={`Remove ${p.name}`} className="absolute right-2 top-2 rounded-sm p-1 text-ash transition-colors hover:text-ember"><X className="h-3.5 w-3.5" /></button>
                        <Link href={`/product/${p.slug}`} className="block">
                          <div className="mx-auto h-28 w-24 p-1"><img src={p.image} alt={p.name} className="h-full w-full object-contain transition-transform duration-500 hover:scale-110" /></div>
                          <p className="mt-2 text-center font-display text-[13.5px] font-bold uppercase tracking-wide">{p.name}</p>
                          {p.onSale && <div className="mt-1.5 text-center"><Badge tone="crimson">On deal</Badge></div>}
                          <div className="mt-2 flex justify-center"><Rating value={p.ratingAverage} size={10} /></div>
                        </Link>
                        <div className="num mt-2 text-center font-mono text-[13px] text-crimson">{formatTk(p.basePrice)}</div>
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          <Button size="sm" onClick={() => { const v = p.variants.find((x) => x.stock > 0) ?? p.variants[0]; if (v) cart.add({ variantId: v.id, productId: p.id, slug: p.slug, sku: v.sku, name: p.name, price: v.price, compareAtPrice: v.compareAtPrice, image: p.image, label: v.label, stock: v.stock }); }}>Add</Button>
                          <Link href={`/product/${p.slug}`} className="inline-flex h-8 items-center justify-center rounded-sm border border-white/15 text-[10px] font-semibold uppercase tracking-[0.14em] text-mist transition-colors hover:border-crimson/60">Details</Link>
                        </div>
                      </div>
                    </motion.th>
                  ))}
                </AnimatePresence>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const best = bestFor(row);
                return (
                  <tr key={row.label} className="group">
                    <th scope="row" className={cn("label-tech !normal-case !tracking-[0.04em] !text-[11px] border-t border-white/[0.06] py-3 pr-4 text-left", ri % 2 && "bg-white/[0.012]")}>{row.label}</th>
                    {items.map((p) => {
                      const raw = row.get(p);
                      const win = best != null && Number(raw) === best;
                      return (
                        <td key={p.id} className={cn("num border-t border-white/[0.06] px-4 py-3 text-center font-mono text-[12.5px] transition-colors", ri % 2 && "bg-white/[0.012]", win && "relative bg-crimson/[0.07] text-white")}>
                          {win && best != null && items.length > 1 && <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-crimson p-[3px] text-white"><Check className="h-2.5 w-2.5" /></span>}
                          {row.display ? row.display(raw) : String(raw)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={picker} onOpenChange={setPicker} title="Choose devices to compare" wide>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {all.map((p) => {
            const on = items.some((x) => x.id === p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleAdd(p)}
                className={cn("flex items-center gap-3 rounded-md border p-3 text-left transition-all active:scale-[0.98]", on ? "border-crimson/60 bg-crimson/[0.08]" : "border-white/10 hover:border-white/30")}
              >
                <img src={p.image} alt="" className="h-14 w-12 object-contain" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[13px] font-semibold">{p.name}</span>
                  <span className="num block font-mono text-[11px] text-ash">{formatTk(p.basePrice)}</span>
                </span>
                <span className={cn("grid h-5 w-5 place-items-center rounded-full border transition-colors", on ? "border-crimson bg-crimson text-white" : "border-white/25 text-transparent")}>
                  <Check className="h-3 w-3" />
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-between">
          <p className="num text-[11.5px] text-ash">{items.length}/4 selected</p>
          <Button onClick={() => setPicker(false)}>Done</Button>
        </div>
      </Modal>
    </>
  );
}

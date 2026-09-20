"use client";

import { useState } from "react";
import { Eye, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { AdminCard, AdminTable, LoadingBlock, useAdmin, useMutator } from "@/components/admin/admin-ui";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/bits";
import { formatTk } from "@/lib/money";
import { cn } from "@/lib/utils";

type Row = {
  id: string; slug: string; name: string; tagline: string; basePrice: number; compareAtPrice: number | null;
  featured: boolean; isNew: boolean; badge: string | null; categorySlug: string; categoryName: string;
  totalStock: number; ratingAverage: number; onSale: boolean;
  variants: { id: string; sku: string; label: string; price: number; active: boolean; stock: number }[];
};
type List = { ok: boolean; products: Row[] };
type Cats = { ok: boolean; categories: { id: string; name: string; slug: string }[] };

const BLANK = { name: "", slug: "", tagline: "", description: "", categorySlug: "phones", basePrice: 9990000, compareAtPrice: null as number | null, featured: false, isNew: true, badge: "", primaryImage: "/renders/hero-obsidian.jpg" };

export default function AdminProductsPage() {
  const { data, loading, reload } = useAdmin<List>("/api/admin/products");
  const { data: cats } = useAdmin<Cats>("/api/admin/categories");
  const create = useMutator("/api/admin/products", reload);
  const patchVariant = useMutator("/api/admin/variants", reload);
  const [editing, setEditing] = useState<null | typeof BLANK & { id?: string }>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = (data?.products ?? []).filter((p) => !q || (p.name + p.slug + p.categoryName).toLowerCase().includes(q.toLowerCase()));

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    const body = {
      name: editing.name, slug: editing.slug || undefined, tagline: editing.tagline, description: editing.description,
      categorySlug: editing.categorySlug, basePrice: Number(editing.basePrice), compareAtPrice: editing.compareAtPrice ? Number(editing.compareAtPrice) : null,
      featured: editing.featured, isNew: editing.isNew, badge: editing.badge || null, primaryImage: editing.primaryImage,
    };
    const ok = editing.id
      ? await mutatePatch(editing.id, body)
      : await create("POST", body, "Product created with a starter variant");
    setBusy(false);
    if (ok) setEditing(null);
  };
  const mutatePatch = (id: string, body: Record<string, unknown>) =>
    fetch(`/api/admin/products/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(async (r) => {
      const d = await r.json();
      if (!r.ok || d.ok === false) throw new Error(d.error);
      reload(); return true;
    }).catch((e) => { alert((e as Error).message); return false; });

  const remove = async (p: Row) => {
    if (!confirm(`Delete “${p.name}” and all variants? Orders keep their snapshots.`)) return;
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" }).then(async (r) => {
      const d = await r.json();
      if (d.ok) reload(); else alert(d.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-tech">Catalog</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Products</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ash" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" aria-label="Filter products" className="h-9 w-44 rounded-sm border border-white/10 bg-white/[0.05] pl-8 pr-3 text-[12px] placeholder:text-ash/70 focus:border-crimson/60 focus:outline-none" />
          </div>
          <Button size="md" onClick={() => setEditing({ ...BLANK })}><Plus className="h-3.5 w-3.5" />New product</Button>
        </div>
      </div>

      {loading || !data ? <LoadingBlock text="Loading catalog…" /> : (
        <AdminCard>
          <AdminTable
            dense
            head={["Product", "Category", "Price", "Stock", "Rating", "Flags", ""]}
            rows={rows.map((p) => [
              <button key="n" onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="group flex items-center gap-3 text-left">
                <span>
                  <span className="block font-display text-[13px] font-semibold group-hover:text-crimson">{p.name}</span>
                  <span className="num block font-mono text-[10px] text-ash">/{p.slug} · {p.variants.length} variant(s)</span>
                </span>
              </button>,
              <span key="c" className="text-[11.5px] text-ash">{p.categoryName}</span>,
              <span key="p" className="num font-mono text-[12px]">{formatTk(p.basePrice)}{p.onSale && <em className="ml-1.5 not-italic text-emerald-400">deal</em>}</span>,
              <span key="s" className={cn("num font-mono text-[11.5px]", p.totalStock === 0 ? "text-ember" : p.totalStock <= 5 ? "text-amber-300" : "text-mist")}>{p.totalStock}</span>,
              <span key="r" className="num font-mono text-[11.5px]">{p.ratingAverage.toFixed(1)}★</span>,
              <span key="f" className="flex justify-end gap-1">
                {p.featured && <Badge tone="crimson">featured</Badge>}
                {p.isNew && <Badge tone="outline">new</Badge>}
              </span>,
              <span key="a" className="flex items-center justify-end gap-1">
                <Link href={`/product/${p.slug}`} target="_blank" aria-label="View product page" className="rounded-sm p-1.5 text-ash transition-colors hover:bg-white/10 hover:text-white"><Eye className="h-3.5 w-3.5" /></Link>
                <button onClick={() => setEditing({ ...BLANK, ...p, badge: p.badge ?? "", compareAtPrice: p.compareAtPrice, description: p.tagline })} aria-label="Edit product" className="rounded-sm p-1.5 text-ash transition-colors hover:bg-white/10 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(p)} aria-label="Delete product" className="rounded-sm p-1.5 text-ash transition-colors hover:bg-ember/10 hover:text-ember"><Trash2 className="h-3.5 w-3.5" /></button>
              </span>,
            ])}
            keyOf={(i) => rows[i]?.id ?? String(i)}
          />
          {expanded && (() => {
            const p = rows.find((r) => r.id === expanded);
            if (!p) return null;
            return (
              <div className="border-t border-white/[0.06] px-4 py-3">
                <p className="label-tech mb-2">Variants & inventory — edit stock inline, it&apos;s the live number</p>
                <ul className="grid gap-1.5 md:grid-cols-2">
                  {p.variants.map((v) => (
                    <li key={v.id} className="flex items-center gap-2 rounded-sm bg-white/[0.03] px-3 py-2">
                      <span className="num flex-1 font-mono text-[10.5px] text-ash">{v.sku}</span>
                      <span className="text-[11.5px]">{v.label}</span>
                      <span className="num font-mono text-[11px] text-mist">{formatTk(v.price)}</span>
                      <StockInput sku={v.sku} stock={v.stock} onSave={(stock) => patchVariant("PATCH", { variantId: v.id, stock }, `Stock for ${v.sku} set to ${stock}`)} />
                      <button onClick={() => patchVariant("PATCH", { variantId: v.id, isActive: !v.active }, v.active ? "Variant hidden" : "Variant live")} aria-label="Toggle variant active" className={cn("rounded-sm p-1 transition-colors", v.active ? "text-emerald-400" : "text-ash hover:text-white")}><Star className="h-3.5 w-3.5" fill={v.active ? "currentColor" : "none"} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </AdminCard>
      )}

      <Modal wide open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)} title={editing?.id ? "Edit product" : "New product"}>
        {editing && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>{(id) => <Input id={id} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />}</Field>
              <Field label="Slug" hint={editing.id ? "fixed" : "auto from name"}>{(id) => <Input id={id} disabled={Boolean(editing.id)} value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder={editing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")} />}</Field>
              <Field label="Tagline" className="sm:col-span-2">{(id) => <Input id={id} value={editing.tagline} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} />}</Field>
              <Field label="Category">{(id) => (
                <Select id={id} value={editing.categorySlug} onChange={(e) => setEditing({ ...editing, categorySlug: e.target.value })}>
                  {(cats?.categories ?? []).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </Select>
              )}</Field>
              <Field label="Price (poisha)" hint="1 ৳ = 100">{(id) => <Input id={id} type="number" value={editing.basePrice} onChange={(e) => setEditing({ ...editing, basePrice: Number(e.target.value) })} />}</Field>
              <Field label="Compare-at (poisha)" hint="optional">{(id) => <Input id={id} type="number" value={editing.compareAtPrice ?? ""} onChange={(e) => setEditing({ ...editing, compareAtPrice: e.target.value ? Number(e.target.value) : null })} />}</Field>
              <Field label="Badge" hint="optional">{(id) => <Input id={id} value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} placeholder="Crimson Edition" />}</Field>
              <Field label="Primary image">{(id) => <Input id={id} value={editing.primaryImage} onChange={(e) => setEditing({ ...editing, primaryImage: e.target.value })} />}</Field>
              <Field label="Description" required className="sm:col-span-2">{(id) => <Textarea id={id} rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />}</Field>
            </div>
            <label className="flex items-center gap-2 text-[12px] text-mist"><input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="accent-[#D71920]" />Featured on homepage</label>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button loading={busy} disabled={editing.name.length < 2 || editing.description.length < 10} onClick={save}>{editing.id ? "Save changes" : "Create product"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function StockInput({ sku, stock, onSave }: { sku: string; stock: number; onSave: (n: number) => Promise<unknown> }) {
  const [v, setV] = useState(String(stock));
  const [dirty, setDirty] = useState(false);
  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => { e.preventDefault(); if (dirty) onSave(Math.max(0, Number(v) || 0)); setDirty(false); }}
    >
      <input aria-label={`Stock for ${sku}`} type="number" min={0} value={v} onChange={(e) => { setV(e.target.value); setDirty(true); }} className="num h-7 w-[62px] rounded-sm border border-white/10 bg-white/[0.05] px-2 text-right font-mono text-[11px] focus:border-crimson/60 focus:outline-none" />
      <button type="submit" disabled={!dirty} className={cn("h-7 rounded-sm border px-2 font-mono text-[9px] uppercase tracking-widest transition-colors", dirty ? "border-crimson/50 text-crimson hover:bg-crimson/10" : "border-white/10 text-ash/40")}>Set</button>
    </form>
  );
}

"use client";

/** Shop grid with live filtering/sorting/pagination — queries the API, never fake data. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { ProductView } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { formatTk, TAX_RATE } from "@/lib/money";
import { cn, debounce } from "@/lib/utils";
import { Drawer } from "@/components/ui/drawer";

export type Filters = {
  q: string; category: string; ram: string; storage: string; color: string;
  price: string; rating: string; available: string; onSale: string; sort: string; page: number;
};

export const defaultFilters: Filters = {
  q: "", category: "", ram: "", storage: "", color: "", price: "", rating: "", available: "", onSale: "", sort: "featured", page: 1,
};

const PRICE_BANDS = [
  { key: "", label: "Any price" },
  { key: "0-8000000", label: "Under ৳80,000" },
  { key: "8000000-15000000", label: "৳80,000 – ৳150,000" },
  { key: "15000000-20000000", label: "৳150,000 – ৳200,000" },
  { key: "20000000-99999999", label: "Over ৳200,000" },
];

export function ShopClient({ initial, initialTotal, facets, lockedCategory }: {
  initial: ProductView[]; initialTotal: number;
  facets: { colors: { key: string; label: string; hex: string }[]; rams: number[]; storages: number[]; categories: { slug: string; name: string }[] };
  lockedCategory?: string;
}) {
  const sp = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    category: lockedCategory ?? sp.get("category") ?? "",
    q: sp.get("q") ?? "",
    sort: sp.get("sort") ?? "featured",
    onSale: sp.get("sale") === "1" ? "1" : "",
  }));
  const [items, setItems] = useState<ProductView[]>(initial);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visible, setVisible] = useState(Math.min(initial.length, 8));
  const reqId = useRef(0);

  const set = (patch: Partial<Filters>) => {
    const next = { ...filters, page: 1, ...patch };
    setFilters(next);
  };

  const fetchPage = useCallback(async (f: Filters) => {
    const id = ++reqId.current;
    setLoading(true);
    const params = new URLSearchParams();
    const cat = lockedCategory ?? f.category;
    if (f.q) params.set("q", f.q);
    if (cat) params.set("category", cat);
    if (f.ram) params.set("ram", f.ram);
    if (f.storage) params.set("storage", f.storage);
    if (f.color) params.set("color", f.color);
    if (f.rating) params.set("rating", f.rating);
    if (f.available) params.set("available", "1");
    if (f.onSale) params.set("sale", "1");
    if (f.price) {
      const [min, max] = f.price.split("-");
      if (min) params.set("min", min);
      if (max) params.set("max", max);
    }
    params.set("sort", f.sort);
    params.set("page", "1");
    params.set("perPage", "12");
    try {
      const r = await fetch(`/api/products?${params}`);
      const d = await r.json();
      if (id !== reqId.current) return;
      setItems(d.items ?? []);
      setTotal(d.total ?? 0);
      setVisible(Math.min(d.items?.length ?? 0, 8));
      // keep URL shareable
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.replaceState(null, "", url);
    } catch { /* transient — keep current results */ }
    finally { if (id === reqId.current) setLoading(false); }
  }, [lockedCategory]);

  // debounce live filtering
  const debouncedFetch = useMemo(() => debounce((f: Filters) => fetchPage(f), 280), [fetchPage]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    debouncedFetch(filters);
  }, [filters, debouncedFetch]);

  const activeChips = useMemo(() => {
    const chips: { key: keyof Filters; label: string }[] = [];
    if (filters.q) chips.push({ key: "q", label: `“${filters.q}”` });
    if (filters.category) chips.push({ key: "category", label: facets.categories.find((c) => c.slug === filters.category)?.name ?? filters.category });
    if (filters.ram) chips.push({ key: "ram", label: `${filters.ram}GB RAM` });
    if (filters.storage) chips.push({ key: "storage", label: `${Number(filters.storage) >= 1024 ? filters.storage + "GB" : filters.storage + "GB"}` });
    if (filters.color) chips.push({ key: "color", label: facets.colors.find((c) => c.key === filters.color)?.label ?? filters.color });
    if (filters.price) chips.push({ key: "price", label: PRICE_BANDS.find((b) => b.key === filters.price)?.label ?? "" });
    if (filters.rating) chips.push({ key: "rating", label: `${filters.rating}★ & up` });
    if (filters.available) chips.push({ key: "available", label: "In stock" });
    if (filters.onSale) chips.push({ key: "onSale", label: "On deal" });
    return chips;
  }, [filters, facets]);

  const show = items.slice(0, visible);

  const controls = (
    <div className="space-y-7">
      <FilterGroup title="Category">
        {!lockedCategory && (
          <div className="flex flex-col gap-1">
            {[{ slug: "", name: "All products" }, ...facets.categories].map((c) => (
              <button
                key={c.slug || "all"}
                onClick={() => set({ category: c.slug })}
                className={cn("rounded-sm px-3 py-2 text-left text-[12.5px] transition-all", filters.category === c.slug ? "bg-crimson/15 text-white" : "text-ash hover:bg-white/[0.05] hover:text-mist")}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="flex flex-col gap-1">
          {PRICE_BANDS.map((b) => (
            <button key={b.key} onClick={() => set({ price: b.key })} className={cn("rounded-sm px-3 py-2 text-left text-[12.5px] transition-all", filters.price === b.key ? "bg-crimson/15 text-white" : "text-ash hover:bg-white/[0.05] hover:text-mist")}>
              {b.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="RAM">
        <div className="flex flex-wrap gap-1.5">
          {facets.rams.map((r) => <ChipBtn key={r} active={filters.ram === String(r)} onClick={() => set({ ram: filters.ram === String(r) ? "" : String(r) })}>{r}GB</ChipBtn>)}
        </div>
      </FilterGroup>

      <FilterGroup title="Storage">
        <div className="flex flex-wrap gap-1.5">
          {facets.storages.map((s) => <ChipBtn key={s} active={filters.storage === String(s)} onClick={() => set({ storage: filters.storage === String(s) ? "" : String(s) })}>{s >= 1024 ? `${s / 1024}TB` : `${s}GB`}</ChipBtn>)}
        </div>
      </FilterGroup>

      <FilterGroup title="Finish">
        <div className="flex flex-wrap gap-2">
          {facets.colors.map((c) => (
            <button
              key={c.key} aria-label={c.label} aria-pressed={filters.color === c.key}
              onClick={() => set({ color: filters.color === c.key ? "" : c.key })}
              className={cn("h-7 w-7 rounded-full border transition-all hover:scale-110", filters.color === c.key ? "border-crimson ring-2 ring-crimson/30 ring-offset-2 ring-offset-carbon" : "border-white/25")}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="flex flex-wrap gap-1.5">
          {["4.5", "4", "3.5"].map((r) => <ChipBtn key={r} active={filters.rating === r} onClick={() => set({ rating: filters.rating === r ? "" : r })}>{r}★ & up</ChipBtn>)}
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <div className="flex flex-col gap-1.5">
          <ToggleRow label="In stock only" on={Boolean(filters.available)} onToggle={(v) => set({ available: v ? "1" : "" })} />
          <ToggleRow label="On deal" on={Boolean(filters.onSale)} onToggle={(v) => set({ onSale: v ? "1" : "" })} />
        </div>
      </FilterGroup>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 no-scrollbar">{controls}</div>
      </aside>

      <div>
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] pb-4">
          <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 rounded-sm border border-white/12 px-3.5 py-2 text-[12px] text-mist transition-colors hover:border-crimson/50 lg:hidden">
            <SlidersHorizontal className="h-3.5 w-3.5" />Filters
            {activeChips.length > 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-crimson text-[9px] font-bold">{activeChips.length}</span>}
          </button>
          <p className="num text-[12.5px] text-ash" aria-live="polite">
            {loading ? <span className="inline-flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-crimson/40 border-t-crimson" />Updating…</span> : <><span className="text-white">{total}</span> product{total === 1 ? "" : "s"} <span className="text-ash/60">· tax {TAX_RATE * 100}% incl. display</span></>}
          </p>
          <label className="ml-auto flex items-center gap-2">
            <span className="sr-only">Sort products</span>
            <Select value={filters.sort} onChange={(e) => set({ sort: e.target.value })} className="!w-[170px] !py-2 !text-[12px]" aria-label="Sort by">
              <option value="featured">Featured</option>
              <option value="newest">Newest first</option>
              <option value="price-asc">Price — low to high</option>
              <option value="price-desc">Price — high to low</option>
              <option value="rating">Top rated</option>
            </Select>
          </label>
        </div>

        {/* chips */}
        <AnimatePresence>
          {activeChips.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 pt-3.5">
                {activeChips.map((c) => (
                  <motion.button layout key={c.label} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} onClick={() => set({ [c.key]: "" } as Partial<Filters>)} className="group flex items-center gap-1.5 rounded-full border border-crimson/40 bg-crimson/10 py-1 pl-3 pr-2 text-[11px] text-crimson transition-colors hover:bg-crimson/20">
                    {c.label}
                    <X className="h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100" />
                  </motion.button>
                ))}
                <button onClick={() => set({ ...defaultFilters, sort: filters.sort })} className="ml-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ash underline-offset-4 transition-colors hover:text-white hover:underline">
                  Clear all
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* grid */}
        {show.length === 0 && !loading ? (
          <EmptyState
            illustration="search"
            title="No matches found."
            body="Nothing fits this exact combination of filters. Loosen one — or browse the full line-up."
            cta={<ButtonLink href="/shop" size="md" onClick={() => set({ ...defaultFilters })}>Clear filters & browse all</ButtonLink>}
          />
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {show.map((p, i) => <ProductCard key={p.id + filters.sort + filters.page} product={p} index={i} />)}
          </div>
        )}

        {show.length < items.length && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <button onClick={() => setVisible((v) => v + 4)} className={cn("group relative flex h-11 items-center gap-2 overflow-hidden rounded-sm border border-white/20 px-8 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-mist transition-all hover:border-crimson/60 hover:text-white")}>
              Load more
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
            </button>
            <p className="num font-mono text-[10px] uppercase tracking-[0.2em] text-ash">{show.length} of {items.length} — {formatTk(8000000)} to {formatTk(22000000)} range</p>
          </div>
        )}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Filters" side="left"
        footer={<div className="flex gap-2"><ButtonLink href="/shop" variant="outline" full size="md" onClick={() => set({ ...defaultFilters })}>Reset</ButtonLink><button onClick={() => setDrawerOpen(false)} className="h-10 flex-1 rounded-sm bg-gradient-to-b from-crimson to-[#a80f15] font-display text-[12px] font-semibold uppercase tracking-[0.14em]">Show {total}</button></div>}
      >
        {controls}
      </Drawer>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="label-tech mb-2.5">{title}</h3>
      {children}
    </section>
  );
}
function ChipBtn({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={cn("rounded-sm border px-2.5 py-1.5 font-mono text-[10.5px] transition-all active:scale-95", active ? "border-crimson/70 bg-crimson/15 text-white" : "border-white/12 text-ash hover:border-white/30 hover:text-mist")}>
      {children}
    </button>
  );
}
function ToggleRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button onClick={() => onToggle(!on)} role="switch" aria-checked={on} className="flex items-center justify-between rounded-sm px-3 py-1.5 text-[12.5px] text-mist transition-colors hover:bg-white/[0.05]">
      {label}
      <span className={cn("relative h-5 w-9 rounded-full border transition-colors", on ? "border-crimson/60 bg-crimson/80" : "border-white/15 bg-white/[0.07]")}>
        <span className={cn("absolute top-[2px] h-3.5 w-3.5 rounded-full bg-white transition-all duration-200", on ? "left-[17px]" : "left-[2px]")} />
      </span>
    </button>
  );
}

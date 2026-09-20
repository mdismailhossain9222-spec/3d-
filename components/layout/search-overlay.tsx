"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallbackRef } from "@/lib/hooks";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, CornerDownLeft, TrendingUp, Cpu, Watch, BatteryCharging } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatTk } from "@/lib/money";
import type { ProductCardView } from "@/lib/types";

const RECENT_KEY = "fs_recent_searches";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ProductCardView[] | null>(null);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const deb = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) {
      try { setRecents(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")); } catch { setRecents([]); }
      setTimeout(() => inputRef.current?.focus(), 80);
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      setQ(""); setResults(null);
    }
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  const run = useCallbackRef((query: string) => {
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => { setResults(d.products ?? []); setCategories(d.categories ?? []); })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  });

  useEffect(() => {
    if (!open) return;
    if (deb.current) clearTimeout(deb.current);
    if (!q.trim()) { run(""); return; }
    deb.current = setTimeout(() => run(q), 220);
    return () => deb.current && clearTimeout(deb.current);
  }, [q, open, run]);

  const commit = (query: string) => {
    const next = [query, ...recents.filter((r) => r !== query)].slice(0, 6);
    setRecents(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    onClose();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[170] bg-void/92 backdrop-blur-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Search FAISTOF"
        >
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mx-auto flex h-full max-w-3xl flex-col px-4 pt-10 md:pt-20"
          >
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-ash">
              <span>Search the ecosystem</span>
              <button onClick={onClose} aria-label="Close search" className="rounded-sm p-2 transition-all hover:rotate-90 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="relative mt-5">
              <Search className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 text-crimson" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && q.trim() && commit(q.trim())}
                placeholder="Search phones, audio, power…"
                aria-label="Search"
                className="w-full border-b border-white/15 bg-transparent pb-4 pl-12 text-2xl font-light text-snow outline-none transition-colors placeholder:text-ash/50 focus:border-crimson md:text-4xl"
              />
              {loading && <span className="absolute -bottom-[1px] left-0 h-[2px] w-full overflow-hidden"><span className="fs-loader-bar absolute inset-y-0 block w-1/3 animate-[slide_1s_linear_infinite]" /></span>}
            </div>

            <div className="mt-6 flex-1 overflow-y-auto pb-10">
              {!q && (
                <div className="grid gap-8 md:grid-cols-2">
                  {recents.length > 0 && (
                    <section aria-label="Recent searches">
                      <h3 className="label-tech mb-3 flex items-center gap-2"><TrendingUp className="h-3 w-3 text-crimson" />Recent</h3>
                      <div className="flex flex-wrap gap-2">
                        {recents.map((r) => (
                          <button key={r} onClick={() => setQ(r)} className="rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] text-mist transition-all hover:border-crimson/60 hover:bg-crimson/10">{r}</button>
                        ))}
                      </div>
                    </section>
                  )}
                  <section aria-label="Popular searches">
                    <h3 className="label-tech mb-3">Popular</h3>
                    <div className="flex flex-wrap gap-2">
                      {["FAISTOF ONE", "Crimson", "5G", "Watch", "Buds", "120W"].map((p) => (
                        <button key={p} onClick={() => setQ(p)} className="rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] text-mist transition-all hover:border-crimson/60 hover:bg-crimson/10">{p}</button>
                      ))}
                    </div>
                  </section>
                  <section aria-label="Categories" className="md:col-span-2">
                    <h3 className="label-tech mb-3">Browse</h3>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      {[
                        { href: "/phones", label: "Phones", icon: <Cpu className="h-4 w-4" />, sub: "4 devices" },
                        { href: "/accessories", label: "Wearables & Audio", icon: <Watch className="h-4 w-4" />, sub: "5 accessories" },
                        { href: "/deals", label: "Deals", icon: <BatteryCharging className="h-4 w-4" />, sub: "Live offers" },
                      ].map((c) => (
                        <Link key={c.href} href={c.href} onClick={onClose} className="glass group flex items-center gap-3 rounded-md p-3.5 transition-all hover:border-crimson/40">
                          <span className="text-crimson">{c.icon}</span>
                          <span>
                            <span className="block text-[13px] font-medium text-snow group-hover:text-white">{c.label}</span>
                            <span className="block text-[11px] text-ash">{c.sub}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {q && results && (
                <>
                  {categories.length > 0 && (
                    <div className="mb-4 flex gap-2">
                      {categories.map((c) => (
                        <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={onClose} className="rounded-full border border-crimson/40 px-3 py-1 text-[11px] text-crimson transition-colors hover:bg-crimson/10">
                          Category: {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  <p className="label-tech mb-3">{results.length} product{results.length === 1 ? "" : "s"}</p>
                  {results.length === 0 && !loading && (
                    <div className="py-10 text-center">
                      <p className="font-display text-lg">No matches for “{q}”.</p>
                      <p className="mt-1 text-[13px] text-ash">Try “ONE”, “audio”, or press Enter to search the full catalog.</p>
                    </div>
                  )}
                  <ul className="divide-y divide-white/[0.06]">
                    {results.map((p, i) => (
                      <motion.li key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <Link href={`/product/${p.slug}`} onClick={onClose} className="group flex items-center gap-4 py-3.5">
                          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-iron p-1.5">
                            <img src={p.image} alt="" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-display text-[14px] font-semibold text-snow group-hover:text-crimson">{p.name}</span>
                            <span className="block truncate text-[12px] text-ash">{p.tagline}</span>
                          </span>
                          <span className="num font-mono text-[12px] text-mist">{formatTk(p.basePrice)}</span>
                          <CornerDownLeft className="h-3.5 w-3.5 text-ash opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </motion.div>
          <style>{`@keyframes slide{from{transform:translateX(-120%)}to{transform:translateX(320%)}}`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

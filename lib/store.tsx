"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { useToast } from "@/components/toast";

/* ───────────────────────── shared helpers ───────────────────────── */
function usePersisted<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(initial);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw));
    } catch { /* corrupted storage — start clean */ }
    setMounted(true);
  }, [key]);
  useEffect(() => {
    if (mounted) {
      try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* quota */ }
    }
  }, [key, state, mounted]);
  return [state, setState, mounted] as const;
}

type SyncFn = (payload: unknown) => Promise<void>;
function useRemoteSync(enabled: React.MutableRefObject<boolean>, sync: SyncFn) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queue = useCallback((payload: unknown) => {
    if (!enabled.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { sync(payload).catch(() => {}); }, 600);
  }, [enabled, sync]);
  return queue;
}

/* ───────────────────────── Cart ───────────────────────── */
export type CartLine = {
  variantId: string; productId: string; slug: string; sku: string; name: string;
  price: number; compareAtPrice?: number | null; image: string; label?: string;
  qty: number; stock: number;
};
export type CartCtx = {
  items: CartLine[]; count: number; subtotal: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  lastAdded: string | null;
  has: (variantId: string) => boolean;
};

const CartContext = createContext<CartCtx | null>(null);

/* ───────────────────────── Wishlist ───────────────────────── */
export type WishItem = { productId: string; slug: string; name: string; price: number; image: string; label?: string };
export type WishCtx = {
  items: WishItem[]; has: (id: string) => boolean;
  toggle: (item: WishItem) => "added" | "removed"; clear: () => void; count: number;
};
const WishlistContext = createContext<WishCtx | null>(null);

/* ───────────────────────── Compare ───────────────────────── */
export type CompareItem = { productId: string; slug: string; name: string };
export type CompareCtx = {
  items: CompareItem[]; has: (id: string) => boolean;
  toggle: (item: CompareItem) => "added" | "removed" | "full"; clear: () => void; count: number;
};
const CompareContext = createContext<CompareCtx | null>(null);

/** True once a session exists — flipped by the account/login flow via window event. */
function useAuthFlag() {
  const has = useRef<boolean>(false);
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) { has.current = true; setAuthed(true); } })
      .catch(() => {});
    const on = () => { has.current = true; setAuthed(true); };
    const off = () => { has.current = false; setAuthed(false); };
    window.addEventListener("fs:login", on);
    window.addEventListener("fs:logout", off);
    return () => { window.removeEventListener("fs:login", on); window.removeEventListener("fs:logout", off); };
  }, []);
  return { has, authed };
}

const merge = (base: CartLine[], remote: CartLine[]) => {
  const map = new Map(base.map((l) => [l.variantId, l]));
  for (const r of remote) {
    const cur = map.get(r.variantId);
    map.set(r.variantId, cur ? { ...r, qty: Math.max(cur.qty, r.qty) } : r);
  }
  return [...map.values()];
};

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const { has: authHas } = useAuthFlag();

  const [items, setItems, cartMounted] = usePersisted<CartLine[]>("fs_cart", []);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [wish, setWish, wishMounted] = usePersisted<WishItem[]>("fs_wishlist", []);
  const [compare, setCompare] = usePersisted<CompareItem[]>("fs_compare", []);

  const pushCart = useRemoteSync(authHas, useCallback(async (payload) => {
    await fetch("/api/cart/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  }, []));
  const pushWish = useRemoteSync(authHas, useCallback(async (payload) => {
    await fetch("/api/wishlist/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  }, []));

  // hydrate authoritative state from the server once when authenticated
  useEffect(() => {
    if (!authHas.current || !cartMounted) return;
    fetch("/api/cart", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.items?.length) setItems((cur) => merge(cur, d.items)); })
      .catch(() => {});
    fetch("/api/wishlist", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.items?.length) setWish((cur) => {
          const map = new Map(cur.map((x) => [x.productId, x]));
          for (const r of d.items) map.set(r.productId, r);
          return [...map.values()];
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartMounted, wishMounted]);

  const api = useMemo<CartCtx>(() => {
    const sync = (next: CartLine[]) =>
      pushCart({ items: next.map((l) => ({ variantId: l.variantId, quantity: l.qty })) });
    return {
      items,
      count: items.reduce((n, l) => n + l.qty, 0),
      subtotal: items.reduce((n, l) => n + l.qty * l.price, 0),
      lastAdded,
      has: (id) => items.some((l) => l.variantId === id),
      add: (line, qty = 1) => {
        setItems((cur) => {
          const ex = cur.find((l) => l.variantId === line.variantId);
          const capped = Math.min((ex?.qty ?? 0) + qty, line.stock || 99);
          const next = ex
            ? cur.map((l) => (l.variantId === line.variantId ? { ...l, qty: capped } : l))
            : [...cur, { ...line, qty: Math.min(qty, line.stock || 99) }];
          sync(next);
          return next;
        });
        setLastAdded(line.variantId);
        window.dispatchEvent(new CustomEvent("fs:cart-add", { detail: { variantId: line.variantId } }));
        toast.push({ kind: "success", title: "Added to cart", body: `${line.name}${line.label ? ` · ${line.label}` : ""}` });
      },
      setQty: (variantId, qty) => {
        setItems((cur) => {
          const next = cur
            .map((l) => (l.variantId === variantId ? { ...l, qty: Math.max(1, Math.min(qty, l.stock || 99)) } : l))
            .filter((l) => l.qty > 0);
          sync(next);
          return next;
        });
      },
      remove: (variantId) => {
        setItems((cur) => { const next = cur.filter((l) => l.variantId !== variantId); sync(next); return next; });
        toast.push({ kind: "info", title: "Removed from cart" });
      },
      clear: () => { setItems([]); sync([]); toast.push({ kind: "info", title: "Cart cleared" }); },
    };
  }, [items, lastAdded, setItems, toast, pushCart]);

  const wishApi = useMemo<WishCtx>(() => {
    const syncW = (next: WishItem[]) => pushWish({ productIds: next.map((x) => x.productId) });
    return {
      items: wish,
      count: wish.length,
      has: (id) => wish.some((w) => w.productId === id),
      toggle: (item) => {
        const exists = wish.some((w) => w.productId === item.productId);
        const next = exists ? wish.filter((w) => w.productId !== item.productId) : [...wish, item];
        setWish(next); syncW(next);
        toast.push({
          kind: exists ? "info" : "success",
          title: exists ? "Removed from wishlist" : "Saved to wishlist",
          body: item.name,
        });
        return exists ? "removed" : "added";
      },
      clear: () => { setWish([]); syncW([]); },
    };
  }, [wish, setWish, toast, pushWish]);

  const cmpApi = useMemo<CompareCtx>(() => ({
    items: compare,
    count: compare.length,
    has: (id) => compare.some((c) => c.productId === id),
    toggle: (item) => {
      const exists = compare.some((c) => c.productId === item.productId);
      if (exists) { setCompare(compare.filter((c) => c.productId !== item.productId)); return "removed"; }
      if (compare.length >= 4) return "full";
      setCompare([...compare, item]);
      toast.push({ kind: "info", title: "Added to compare", body: `${compare.length + 1} of 4 selected` });
      return "added";
    },
    clear: () => setCompare([]),
  }), [compare, setCompare, toast]);

  return (
    <CartContext.Provider value={api}>
      <WishlistContext.Provider value={wishApi}>
        <CompareContext.Provider value={cmpApi}>
          {children}
        </CompareContext.Provider>
      </WishlistContext.Provider>
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
export function useWishlist() {
  const c = useContext(WishlistContext);
  if (!c) throw new Error("useWishlist outside provider");
  return c;
}
export function useCompare() {
  const c = useContext(CompareContext);
  if (!c) throw new Error("useCompare outside provider");
  return c;
}

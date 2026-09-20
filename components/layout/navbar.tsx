"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Search, ShoppingBag, User2, X, Menu, LayoutGrid, LogOut, Settings2, Package } from "lucide-react";
import Logo from "@/components/logo";
import { Drawer } from "@/components/ui/drawer";
import { useCart, useWishlist } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { SearchOverlay } from "@/components/layout/search-overlay";

const LINKS = [
  { label: "Phones", href: "/phones" },
  { label: "Shop", href: "/shop" },
  { label: "Accessories", href: "/accessories" },
  { label: "Deals", href: "/deals" },
  { label: "Compare", href: "/compare" },
  { label: "Support", href: "/support" },
];

function CartIcon({ onClick }: { onClick: () => void }) {
  const cart = useCart();
  const [bump, setBump] = useState(0);
  type Fly = { sx: number; sy: number; tx: number; ty: number; key: number };
  const [flying, setFlying] = useState<Fly | null>(null);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onAdd = () => setBump((b) => b + 1);
    const onFly = (e: Event) => {
      const { x, y } = (e as CustomEvent).detail ?? {};
      setBump((b) => b + 1);
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setFlying((f) => ({ sx: x ?? r.left, sy: y ?? window.innerHeight - 40, tx: r.left + r.width / 2 - 7, ty: r.top + r.height / 2 - 7, key: (f?.key ?? 0) + 1 }));
      setTimeout(() => setFlying(null), 700);
    };
    window.addEventListener("fs:cart-add", onAdd);
    window.addEventListener("fs:fly", onFly as EventListener);
    return () => {
      window.removeEventListener("fs:cart-add", onAdd);
      window.removeEventListener("fs:fly", onFly as EventListener);
    };
  }, []);

  return (
    <button
      ref={ref}
      id="fs-cart-btn"
      onClick={onClick}
      aria-label={`Open cart${cart.count ? `, ${cart.count} items` : ""}`}
      className="relative rounded-sm p-2 text-mist transition-colors hover:bg-white/[0.07] hover:text-white"
    >
      <motion.span
        key={bump}
        initial={{ scale: 1 }}
        animate={bump ? { scale: [1, 1.35, 0.92, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="block"
      >
        <ShoppingBag className="h-[18px] w-[18px]" />
      </motion.span>
      <AnimatePresence>
        {cart.count > 0 && (
          <motion.span
            key={cart.count} initial={{ scale: 0, y: -4 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="num absolute -right-0.5 -top-0.5 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-crimson px-1 font-mono text-[9px] font-bold text-white shadow-crim"
          >
            {cart.count}
          </motion.span>
        )}
      </AnimatePresence>
      {flying && (
        <motion.span
          key={flying.key}
          className="pointer-events-none fixed left-0 top-0 z-[160] h-3.5 w-3.5 rounded-full bg-gradient-to-br from-ember to-crimson shadow-crim"
          initial={{ x: flying.sx, y: flying.sy, scale: 1.5, opacity: 0.4 }}
          animate={{ x: flying.tx, y: flying.ty, scale: [1.5, 1, 0.35], opacity: [0.4, 1, 0.9] }}
          transition={{ duration: 0.62, ease: [0.3, 0.75, 0.5, 1] }}
        />
      )}
    </button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const wish = useWishlist();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ? { name: d.user.name, role: d.user.roleKey } : null))
      .catch(() => setUser(null));
    const on = (e: Event) => setUser((e as CustomEvent).detail ?? null);
    window.addEventListener("fs:user", on as EventListener);
    return () => window.removeEventListener("fs:user", on as EventListener);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    window.dispatchEvent(new CustomEvent("fs:logout"));
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] transition-all duration-500">
        <header
          className={cn(
            "pointer-events-auto mx-auto flex h-[62px] items-center gap-3 px-4 transition-all duration-500 md:h-[70px] md:px-8",
            scrolled ? "border-b border-white/[0.06] bg-void/80 backdrop-blur-xl" : "bg-transparent"
          )}
        >
          <div className="flex items-center gap-8">
            <Link href="/" className="cursor-pointer"><Logo /></Link>
            <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
              {LINKS.map((l) => {
                const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "relative rounded-sm px-3.5 py-2 font-display text-[11.5px] font-medium uppercase tracking-[0.16em] transition-colors",
                      active ? "text-white" : "text-ash hover:text-mist"
                    )}
                  >
                    {l.label}
                    {active && (
                      <motion.span layoutId="nav-active" className="absolute inset-x-3 -bottom-[1px] h-[2px] bg-crimson shadow-crim" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="hidden items-center gap-2 rounded-sm border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-ash transition-all hover:border-white/20 hover:text-mist md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="rounded-[3px] border border-white/10 bg-white/[0.06] px-1 font-mono text-[9px]">/</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className="rounded-sm p-2 text-mist transition-colors hover:bg-white/[0.07] md:hidden">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link href="/wishlist" aria-label={`Wishlist, ${wish.count} saved`} className="relative hidden rounded-sm p-2 text-mist transition-colors hover:bg-white/[0.07] hover:text-white sm:block">
              <Heart className={cn("h-[18px] w-[18px] transition-all", wish.count > 0 && "fill-crimson text-crimson")} />
              {wish.count > 0 && <span className="num absolute -right-0.5 -top-0.5 h-[7px] w-[7px] rounded-full bg-crimson" />}
            </Link>
            <CartIcon onClick={() => setCartOpen(true)} />

            {user ? (
              <div className="group relative hidden md:block">
                <Link href={user.role === "ADMIN" ? "/admin" : "/account"} className="flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.04] py-1.5 pl-2 pr-3 transition-colors hover:border-crimson/50">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-b from-crimson to-[#8e0f14] font-mono text-[9px] font-bold">
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-[12px] font-medium text-mist">{user.name.split(" ")[0]}</span>
                </Link>
                <div className="invisible absolute right-0 top-full w-52 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="glass-deep overflow-hidden rounded-md border border-white/10 p-1 shadow-lift">
                    <MenuLink href="/account"><User2 className="h-3.5 w-3.5" />Account</MenuLink>
                    <MenuLink href="/account/orders"><Package className="h-3.5 w-3.5" />Orders</MenuLink>
                    <MenuLink href="/account/settings"><Settings2 className="h-3.5 w-3.5" />Settings</MenuLink>
                    {user.role === "ADMIN" && <MenuLink href="/admin"><LayoutGrid className="h-3.5 w-3.5" />Admin console</MenuLink>}
                    <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-left text-[12.5px] text-ash transition-colors hover:bg-white/[0.06] hover:text-ember">
                      <LogOut className="h-3.5 w-3.5" />Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login" className="hidden rounded-sm px-3 py-1.5 font-display text-[11.5px] font-semibold uppercase tracking-[0.14em] text-mist transition-colors hover:text-white md:block">
                Sign in
              </Link>
            )}

            <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-sm p-2 text-mist transition-colors hover:bg-white/[0.07] lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} user={user} onLogout={logout} onSearch={() => { setMobileOpen(false); setSearchOpen(true); }} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-[12.5px] text-mist transition-colors hover:bg-white/[0.06] hover:text-white">
      {children}
    </Link>
  );
}

function MobileMenu({ open, onClose, user, onLogout, onSearch }: {
  open: boolean; onClose: () => void; user: { name: string; role: string } | null; onLogout: () => void; onSearch: () => void;
}) {
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} title="Menu" side="left">
      <nav aria-label="Mobile" className="flex flex-col">
        {[{ label: "Home", href: "/" }, ...LINKS].map((l, i) => (
          <motion.div key={l.href} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
            <Link
              href={l.href}
              onClick={onClose}
              className="flex items-center justify-between border-b border-white/[0.06] py-4 font-display text-xl font-semibold tracking-tight text-snow transition-colors hover:text-crimson"
            >
              {l.label}
              <span className="font-mono text-[10px] text-ash">0{i + 1}</span>
            </Link>
          </motion.div>
        ))}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Link href="/search" onClick={onClose} className="glass rounded-sm p-3 text-center text-[12px] text-mist">Search</Link>
          <Link href="/wishlist" onClick={onClose} className="glass rounded-sm p-3 text-center text-[12px] text-mist">Wishlist</Link>
          <Link href="/login" onClick={onClose} className="glass rounded-sm p-3 text-center text-[12px] text-mist">{user ? "Account" : "Sign in"}</Link>
          <Link href={user?.role === "ADMIN" ? "/admin" : "/account"} onClick={onClose} className="glass rounded-sm p-3 text-center text-[12px] text-mist">{user ? (user.role === "ADMIN" ? "Admin" : "Dashboard") : "Register"}</Link>
        </div>
        {user && (
          <button onClick={() => { onLogout(); onClose(); }} className="mt-4 flex items-center justify-center gap-2 rounded-sm border border-ember/30 py-3 text-[13px] text-ember">
            <LogOut className="h-4 w-4" />Sign out
          </button>
        )}
      </nav>
    </Drawer>
  );
}

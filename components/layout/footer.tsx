"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import Logo from "@/components/logo";
import { useToast } from "@/components/toast";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Products",
    links: [
      { label: "FAISTOF ONE", href: "/product/faistof-one" },
      { label: "FAISTOF ONE PRO", href: "/product/faistof-one-pro" },
      { label: "FAISTOF ONE ULTRA", href: "/product/faistof-one-ultra" },
      { label: "FAISTOF LITE", href: "/product/faistof-lite" },
      { label: "All phones", href: "/phones" },
    ],
  },
  {
    title: "Ecosystem",
    links: [
      { label: "FAISTOF WATCH", href: "/product/faistof-watch" },
      { label: "FAISTOF BUDS", href: "/product/faistof-buds" },
      { label: "FAISTOF CHARGE", href: "/product/faistof-charge" },
      { label: "FAISTOF CASE", href: "/product/faistof-case" },
      { label: "FAISTOF POWER", href: "/product/faistof-power" },
    ],
  },
  {
    title: "Store",
    links: [
      { label: "Shop all", href: "/shop" },
      { label: "Deals", href: "/deals" },
      { label: "Compare", href: "/compare" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "Your account", href: "/account" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help center", href: "/support" },
      { label: "Contact", href: "/contact" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Warranty", href: "/warranty" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (d.ok) {
        toast.push({ kind: "success", title: "You're on the list.", body: "Launch briefings, no noise." });
        setEmail("");
      } else toast.push({ kind: "error", title: "Couldn't subscribe", body: d.error });
    } catch {
      toast.push({ kind: "error", title: "Network error", body: "Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="relative mt-24 border-t border-white/[0.07] bg-[#040404]">
      <div className="pointer-events-none absolute inset-x-0 -top-px mx-auto h-px max-w-5xl bg-gradient-to-r from-transparent via-crimson/70 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo size="lg" />
            <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-ash">
              Precision instruments for people who notice the difference. Designed in Dhaka, engineered for everywhere.
            </p>
            <form onSubmit={subscribe} className="mt-7 flex max-w-sm items-center rounded-sm border border-white/12 bg-white/[0.04] focus-within:border-crimson/60">
              <label htmlFor="fs-newsletter" className="sr-only">Email address for newsletter</label>
              <input
                id="fs-newsletter" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Launch briefings — your email"
                className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-[13px] outline-none placeholder:text-ash/60"
              />
              <button
                type="submit" disabled={busy} aria-label="Subscribe"
                className="m-1 grid h-8 w-9 place-items-center rounded-[3px] bg-crimson text-white transition-all hover:bg-ember active:scale-90 disabled:opacity-50"
              >
                {busy ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            </form>
            <div className="mt-6 flex gap-2">
              {[
                { label: "Instagram", d: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.6A3.4 3.4 0 1 0 15.4 12 3.4 3.4 0 0 0 12 8.6Zm5-1.9a.9.9 0 1 0 .9.9.9.9 0 0 0-.9-.9Z" },
                { label: "X", d: "M4 4h4.2l4 5.6L17 4h3l-6.4 7.9L20.5 20h-4.2l-4.4-6L6.6 20H3.5l6.8-8.4Z" },
                { label: "YouTube", d: "M22 12s0-3.3-.4-4.9a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.3.4 4.9a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8Zm-12 3V9l5 3Z" },
              ].map(({ label, d }) => (
                <button
                  key={label} type="button"
                  aria-label={`${label} (showcase link — opens social panel)`}
                  onClick={() => toast.push({ kind: "info", title: `${label}`, body: "FAISTOF social channels launch with the next drop." })}
                  className="grid h-9 w-9 place-items-center rounded-sm border border-white/10 text-ash transition-all hover:-translate-y-0.5 hover:border-crimson/50 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d={d} /></svg>
                </button>
              ))}
              <button
                aria-label="Community (opens social panel)"
                onClick={() => toast.push({ kind: "info", title: "Community", body: "The FAISTOF forum opens with the next drop." })}
                className="grid h-9 w-9 place-items-center rounded-sm border border-white/10 text-ash transition-all hover:-translate-y-0.5 hover:border-crimson/50 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
            {COLS.map((col) => (
              <div key={col.title}>
                <h3 className="label-tech mb-4 !text-white/50">{col.title}</h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="group inline-flex items-center gap-1.5 text-[13px] text-ash transition-colors hover:text-snow">
                        <span className="h-px w-0 bg-crimson transition-all duration-300 group-hover:w-3" />
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-6">
          <span className="label-tech !text-[9px]">Secure payments</span>
          {["VISA", "Mastercard", "bKash", "Nagad", "SSLCommerz"].map((p) => (
            <span key={p} className="rounded-[3px] border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] tracking-widest text-mist/70 transition-colors hover:border-crimson/40 hover:text-mist">{p}</span>
          ))}
          <p className="ml-auto text-[11px] text-ash">© {new Date().getFullYear()} FAISTOF Commerce Ltd. Fictional brand, real engineering.</p>
        </div>
      </div>

      {/* oversized watermark */}
      <motion.div aria-hidden className="overflow-hidden">
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="select-none text-center font-display text-[clamp(3.5rem,15.5vw,15rem)] font-bold leading-[0.8] tracking-tighter text-white/[0.045]"
        >
          FAISTOF
        </motion.p>
      </motion.div>
    </footer>
  );
}

"use client";

import { Star } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─────────────────── Badge ─────────────────── */
export function Badge({
  tone = "neutral", children, className,
}: { tone?: "crimson" | "neutral" | "outline" | "success" | "warn"; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[3px] px-2 py-[3px] font-mono text-[9.5px] font-medium uppercase tracking-[0.18em]",
        {
          crimson: "bg-crimson text-white shadow-crim",
          neutral: "bg-white/[0.08] text-mist",
          outline: "border border-crimson/50 text-crimson",
          success: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/25",
          warn: "bg-amber-500/12 text-amber-300 border border-amber-400/25",
        }[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ─────────────────── Rating ─────────────────── */
export function Rating({ value, count, size = 12 }: { value: number; count?: number; size?: number }) {
  const pct = (value / 5) * 100;
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Rated ${value.toFixed(1)} out of 5${count != null ? `, ${count} reviews` : ""}`}>
      <span className="relative inline-flex" aria-hidden>
        <span className="inline-flex text-white/15">
          {[...Array(5)].map((_, i) => <Star key={i} style={{ width: size, height: size }} className="fill-current" strokeWidth={0} />)}
        </span>
        <span className="absolute inset-0 inline-flex overflow-hidden text-ember" style={{ width: `${pct}%` }}>
          {[...Array(5)].map((_, i) => <Star key={i} style={{ width: size, height: size, minWidth: size }} className="fill-current" strokeWidth={0} />)}
        </span>
      </span>
      <span className="num font-mono text-[11px] text-ash">
        {value.toFixed(1)}{count != null && <span className="text-ash/60"> · {count}</span>}
      </span>
    </span>
  );
}

/* ─────────────────── Skeleton ─────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-sm", className)} />;
}

/* ─────────────────── Reveal (scroll-in) ─────────────────── */
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: (d: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Reveal({
  children, delay = 0, className, once = true, y = true,
}: { children: React.ReactNode; delay?: number; className?: string; once?: boolean; y?: boolean }) {
  return (
    <motion.div
      className={className}
      variants={y ? revealVariants : { hidden: { opacity: 0 }, show: revealVariants.show }}
      custom={delay}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────── Section header ─────────────────── */
export function SectionHead({
  kicker, title, sub, right, className,
}: { kicker: string; title: React.ReactNode; sub?: string; right?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="max-w-2xl">
        <Reveal>
          <p className="label-tech mb-3 flex items-center gap-2.5">
            <span className="inline-block h-px w-8 bg-crimson" />
            {kicker}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="text-hero text-[clamp(1.9rem,4.6vw,3.4rem)]">{title}</h2>
        </Reveal>
        {sub && (
          <Reveal delay={0.12}>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ash md:text-[15px]">{sub}</p>
          </Reveal>
        )}
      </div>
      {right}
    </div>
  );
}

/* ─────────────────── Tabs with moving underline ─────────────────── */
export function TabBar({
  tabs, active, onChange, idPrefix,
}: { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void; idPrefix: string }) {
  return (
    <div role="tablist" aria-label="Tabs" className="inline-flex gap-1 rounded-sm border border-white/10 bg-white/[0.03] p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          id={`${idPrefix}-tab-${t.key}`}
          aria-selected={active === t.key}
          aria-controls={`${idPrefix}-panel-${t.key}`}
          onClick={() => onChange(t.key)}
          className={cn(
            "relative rounded-[3px] px-3.5 py-1.5 font-display text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors",
            active === t.key ? "text-white" : "text-ash hover:text-mist"
          )}
        >
          {active === t.key && (
            <motion.span
              layoutId={`${idPrefix}-underline`}
              className="absolute inset-0 -z-10 rounded-[3px] bg-gradient-to-b from-crimson/90 to-[#9d0f15] shadow-crim"
              transition={{ type: "spring", stiffness: 480, damping: 36 }}
            />
          )}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────── Empty state ─────────────────── */
export function EmptyState({
  title, body, cta, illustration = "phone",
}: {
  title: string; body: string; cta?: React.ReactNode;
  illustration?: "phone" | "heart" | "search" | "cart" | "receipt";
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <AnimatePresence>
        <motion.svg
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          viewBox="0 0 120 120"
          className="mb-6 h-24 w-24 text-white/12"
          fill="none"
          aria-hidden
        >
          {illustration === "phone" && (
            <>
              <rect x="38" y="18" width="44" height="84" rx="8" stroke="currentColor" strokeWidth="2.5" />
              <rect x="44" y="26" width="32" height="62" rx="4" fill="rgba(215,25,32,0.15)" />
              <circle cx="60" cy="94" r="2.5" fill="#D71920" />
            </>
          )}
          {illustration === "heart" && (
            <path d="M60 92C36 74 26 60 26 46a16 16 0 0 1 34-7 16 16 0 0 1 34 7c0 14-10 28-34 46z" stroke="currentColor" strokeWidth="2.5" fill="rgba(215,25,32,0.12)" />
          )}
          {illustration === "search" && (
            <>
              <circle cx="54" cy="54" r="26" stroke="currentColor" strokeWidth="2.5" />
              <path d="M74 74l18 18" stroke="#D71920" strokeWidth="3" strokeLinecap="round" />
            </>
          )}
          {illustration === "cart" && (
            <>
              <path d="M26 34h10l8 36h38l8-26H44" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="50" cy="84" r="5" fill="#D71920" />
              <circle cx="80" cy="84" r="5" fill="currentColor" />
            </>
          )}
          {illustration === "receipt" && (
            <>
              <path d="M38 20h44v80l-8-6-8 6-8-6-8 6-8-6-4 4z" stroke="currentColor" strokeWidth="2.5" fill="rgba(215,25,32,0.06)" />
              <path d="M48 38h24M48 52h24M48 66h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ash">{body}</p>
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}

/* ─────────────────── Toggle switch ─────────────────── */
export function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 rounded-full border transition-colors duration-300",
        checked ? "border-crimson/60 bg-crimson/80" : "border-white/15 bg-white/[0.07]"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
        className={cn("absolute top-[2.5px] h-[17px] w-[17px] rounded-full bg-white shadow", checked ? "left-[23px]" : "left-[3px]")}
      />
    </button>
  );
}

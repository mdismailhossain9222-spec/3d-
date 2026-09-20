"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks";
import { formatTk } from "@/lib/money";
import type { ProductView } from "@/lib/types";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => <HeroPoster />,
  onError: () => <HeroPoster />,
});

function HeroPoster() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <img src="/renders/hero-obsidian.jpg" alt="FAISTOF ONE" className="max-h-[76%] w-auto animate-[animFloat_7s_ease-in-out_infinite] object-contain drop-shadow-[0_60px_80px_rgba(0,0,0,0.9)]" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80"; }} />
      <style>{`@keyframes animFloat{0%,100%{transform:translateY(-8px) rotate(-0.5deg)}50%{transform:translateY(10px) rotate(0.5deg)}}`}</style>
    </div>
  );
}

/* beats: 0 intro · 1 sweep · 2 specs · 3 rear · 4 lens · 5 display · 6 perf · 7 exit */
const BEATS = [
  { from: 0, to: 0.12 },
  { from: 0.12, to: 0.26 },
  { from: 0.26, to: 0.42 },
  { from: 0.42, to: 0.58 },
  { from: 0.58, to: 0.72 },
  { from: 0.72, to: 0.86 },
  { from: 0.86, to: 1 },
];
const inBeat = (p: number, i: number) => p >= BEATS[i].from && p < BEATS[i].to;

export function Hero({ product }: { product: ProductView | null }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneState = useRef({ p: 0, tiltX: 0, tiltY: 0, color: "#0b0b0d" });
  const [beat, setBeat] = useState(0);
  const [intro, setIntro] = useState(false);
  const reduced = useReducedMotion();
  const barRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setIntro(true), 120); // after splash hands over
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduced || !wrapRef.current) return;
    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: "#fs-hero-pin",
        pinSpacing: false,
        scrub: 0.65,
        onUpdate: (self) => {
          const p = self.progress;
          sceneState.current.p = p;
          const nb = p < 0.12 ? 0 : p < 0.26 ? 1 : p < 0.42 ? 2 : p < 0.58 ? 3 : p < 0.72 ? 4 : p < 0.86 ? 5 : 6;
          setBeat((prev) => (prev === nb ? prev : nb));
          if (barRef.current) barRef.current.style.transform = `scaleY(${Math.max(0.01, p)})`;
          if (sweepRef.current) {
            const q = gsap.utils.mapRange(0.05, 0.3, 0, 1, p);
            sweepRef.current.style.transform = `translateX(${(-140 + q * 280).toFixed(1)}vw)`;
            sweepRef.current.style.opacity = `${Math.sin(Math.min(1, q) * Math.PI) * 0.5}`;
          }
        },
      });
      return () => st.kill();
    }, wrapRef);

    const move = (e: PointerEvent) => {
      const w = window.innerWidth, h = window.innerHeight;
      sceneState.current.tiltY = ((e.clientX / w) - 0.5) * 0.55;
      sceneState.current.tiltX = ((e.clientY / h) - 0.5) * 0.35;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      ctx.revert();
      window.removeEventListener("pointermove", move);
    };
  }, [reduced]);

  // mobile / reduced: gentle image float instead of the pinned WebGL sequence
  if (reduced) {
    return (
      <section className="relative grid min-h-[92vh] place-items-center overflow-hidden px-4">
        <div className="pointer-events-none absolute inset-0 crimson-atmosphere" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <HeroPoster />
          <h1 className="text-hero mt-8 text-[clamp(2.6rem,9vw,4.6rem)]">Precision,<br />unleashed.</h1>
          <p className="mt-4 max-w-md text-[15px] text-ash">Meet the next generation of flagship performance.</p>
          <div className="mt-7 flex gap-3">
            <Link href="/product/faistof-one" className={btnPrimary}>Explore FAISTOF ONE</Link>
            <Link href="/shop" className={btnGhost}>Shop now</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={wrapRef} className="relative h-[640vh]">
      <div id="fs-hero-pin" className="sticky top-0 h-screen overflow-hidden bg-void">
        {/* ambient layers */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_55%_at_50%_55%,rgba(90,8,12,0.25),transparent_70%)]" />
        <div ref={sweepRef} className="pointer-events-none absolute -inset-y-10 left-0 w-[46vw] -translate-x-[140vw] [background:linear-gradient(100deg,transparent,rgba(255,49,56,0.10)_38%,rgba(255,255,255,0.06)_50%,rgba(255,49,56,0.10)_60%,transparent)] blur-2xl" style={{ opacity: 0 }} />
        {/* technical grid */}
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]">
          <defs>
            <pattern id="fs-grid" width="56" height="56" patternUnits="userSpaceOnUse">
              <path d="M56 0H0V56" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fs-grid)" />
        </svg>

        {/* the 3D device */}
        <div className={cn("absolute inset-0 transition-opacity duration-700", intro ? "opacity-100" : "opacity-0")}>
          <div className="absolute inset-x-0 top-[8vh] mx-auto aspect-[3/4.4] max-h-[84vh]">
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-[88%] w-full max-w-[560px]">
                <HeroScene state={sceneState} />
              </div>
            </div>
          </div>
        </div>

        {/* ── beat 0 · intro titles ── */}
        <HeroIntro intro={intro} visible={beat === 0} product={product} />

        {/* ── beat 2 · engineering specs ── */}
        <BeatFrame visible={beat === 2} side="right" label="02 · ARCHITECTURE" title="Engineered from the atom up.">
          <SpecList rows={[
            ["Silicon", "Vertex 900 · 4nm · 4.2GHz"],
            ["Display", "6.7\" LumenCore LTPO · 3000 nits"],
            ["Chassis", "Forged FAISTOFlex alloy"],
            ["Thermal", "VaporGrid 4000mm²"],
          ]} />
        </BeatFrame>

        {/* ── beat 3 · rear reveal ── */}
        <BeatFrame visible={beat === 3} side="left" label="03 · SILHOUETTE" title="See what others miss.">
          <p className="max-w-[34ch] text-[13.5px] leading-relaxed text-ash">
            The island is not decoration: three calibrated optics, a laser AA-aligned periscope and
            sapphire-coated glass, tuned by the FAISTOF imaging lab.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
            {["108MP Main", "50MP Ultra", "10MP 3× Tele"].map((t) => (
              <span key={t} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5">{t}</span>
            ))}
          </div>
        </BeatFrame>

        {/* ── beat 4 · lens macro ── */}
        <div className={cn("pointer-events-none absolute inset-0 transition-all duration-500", beat === 4 ? "opacity-100" : "translate-y-4 opacity-0")}>
          <LensCallout x="58%" y="34%" p={70}>Ø 14.2mm · 7P lens stack</LensCallout>
          <LensCallout x="64%" y="56%" p={180}>f/1.4 — f/4.0 variable aperture</LensCallout>
          <LensCallout x="50%" y="70%" p={240}>OIS 2.0 · sensor-level shift</LensCallout>
          <div className="absolute left-1/2 top-[7%] -translate-x-1/2 text-center">
            <p className="label-tech">04 · Adaptive Optics</p>
            <p className="font-display text-[clamp(1.4rem,3.4vw,2.4rem)] font-bold uppercase tracking-tight">Glass that thinks.</p>
          </div>
        </div>

        {/* ── beat 5 · display ── */}
        <BeatFrame visible={beat === 5} side="right" label="05 · LUMENCORE" title="Every pixel, alive.">
          <div className="grid grid-cols-2 gap-3">
            {[["120Hz", "LTPO 3.0 adaptive"], ["3000", "nit peak · HDR10+"], ["1.07B", "colors · 10-bit"], ["ΔE < 1", "factory calibrated"]].map(([v, l]) => (
              <div key={l} className="rounded-md border border-white/[0.08] bg-abyss/70 p-3 backdrop-blur-md">
                <p className="num font-mono text-[17px] font-semibold text-white">{v}</p>
                <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.14em] text-ash">{l}</p>
              </div>
            ))}
          </div>
        </BeatFrame>

        {/* ── beat 6 · performance + exit to commerce ── */}
        <div className={cn("absolute inset-x-0 bottom-[8vh] flex flex-col items-center gap-6 px-4 text-center transition-all duration-700", beat === 6 ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0")}>
          <div className="glass-deep flex w-full max-w-2xl flex-wrap items-stretch justify-center divide-x divide-white/[0.08] rounded-md px-2 shadow-lift">
            {[["4.2", "GHz prime core"], ["16", "GB LPDDR5X"], ["1.2M+", "benchmark class"], ["120", "FPS sustained"]].map(([v, l]) => (
              <div key={l} className="px-4 py-2.5 text-center md:px-6">
                <p className="num font-display text-lg font-bold text-white md:text-xl">{v}<span className="text-crimson">.</span></p>
                <p className="label-tech mt-0.5 !text-[8.5px] !tracking-[0.2em]">{l}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="label-tech">Now configured to taste</p>
            <h2 className="text-hero mt-2 text-[clamp(1.8rem,5vw,3.2rem)]">FAISTOF ONE<span className="text-crimson">.</span></h2>
            <p className="num mt-2 font-mono text-[13px] text-ash">{product ? `From ${formatTk(product.basePrice)} · 4 finishes · 12 configs` : "From ৳149,900"}</p>
          </div>
          <div className="pointer-events-auto flex flex-wrap justify-center gap-3">
            <Link href="/product/faistof-one" className={btnPrimary}>Configure yours <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link href="/shop" className={btnGhost}>Shop all</Link>
          </div>
          <ArrowDown className="h-4 w-4 animate-bounce text-ash" />
        </div>

        {/* ── persistent micro-details ── */}
        <div className="pointer-events-none absolute inset-y-0 right-5 hidden w-8 flex-col items-center justify-center md:flex">
          <span className="label-tech !text-[8px] [writing-mode:vertical-rl] mb-3">SCROLL SEQUENCE</span>
          <div className="relative h-40 w-px bg-white/10">
            <div ref={barRef} className="absolute inset-x-0 top-0 h-full origin-top bg-gradient-to-b from-ember to-crimson" style={{ transform: "scaleY(0.01)" }} />
          </div>
          <span className="num mt-3 font-mono text-[9px] text-ash">0{beat + 1}/7</span>
        </div>
        <div className={cn("pointer-events-none absolute bottom-5 left-5 hidden items-center gap-4 font-mono text-[9.5px] uppercase tracking-[0.22em] text-ash transition-opacity duration-500 md:flex", beat > 0 && beat < 6 ? "opacity-100" : "opacity-0")}>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse-crim rounded-full bg-crimson" />REC</span>
          <span>MODEL FST-01</span>
          <span>162.4 × 76.2 × 8.1 MM</span>
          <span>199 G</span>
        </div>
      </div>
    </div>
  );
}

export const btnPrimary =
  "group inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-gradient-to-b from-crimson to-[#a80f15] px-6 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-crim transition-all duration-300 hover:from-ember hover:shadow-[0_0_34px_rgba(215,25,32,0.55)] active:scale-[0.97]";
export const btnGhost =
  "inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-white/25 px-6 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-mist transition-all duration-300 hover:border-white/60 hover:bg-white/[0.06] active:scale-[0.97]";

function HeroIntro({ intro, visible, product }: { intro: boolean; visible: boolean; product: ProductView | null }) {
  return (
    <div className={cn("absolute inset-x-0 top-[7vh] z-10 flex flex-col items-center px-4 text-center transition-all duration-700", visible ? "opacity-100" : "pointer-events-none -translate-y-8 opacity-0")}>
      <motion.p
        initial={{ opacity: 0, y: 14 }} animate={intro ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.25, duration: 0.7 }}
        className="label-tech mb-4 flex items-center gap-3"
      >
        <span className="h-px w-10 bg-crimson" /> The founding flagship <span className="h-px w-10 bg-crimson" />
      </motion.p>
      <h1 className="text-hero text-[clamp(2.7rem,7.6vw,6.2rem)]">
        {["Precision,", "unleashed."].map((line, li) => (
          <span key={line} className="block overflow-hidden pb-[0.06em]">
            <motion.span
              className={cn("block", li === 1 && "bg-gradient-to-r from-white via-snow to-white/60 bg-clip-text text-white")}
              initial={{ y: "115%" }}
              animate={intro ? { y: 0 } : {}}
              transition={{ delay: 0.45 + li * 0.18, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {line}
              {li === 0 && <span className="text-crimson">.</span>}
            </motion.span>
          </span>
        ))}
      </h1>
      <motion.p initial={{ opacity: 0 }} animate={intro ? { opacity: 1 } : {}} transition={{ delay: 1.0, duration: 0.8 }} className="mt-4 max-w-md text-[14px] text-ash md:text-[15px]">
        Meet the next generation of flagship performance.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={intro ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.25, duration: 0.7 }} className="pointer-events-auto mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/product/faistof-one" className={btnPrimary}>Explore FAISTOF ONE <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></Link>
        <Link href="/shop" className={btnGhost}>Shop now{product ? ` · from ${formatTk(product.basePrice)}` : ""}</Link>
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={intro ? { opacity: 1 } : {}} transition={{ delay: 2.1 }} className="mt-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ash">
        <ArrowDown className="h-3.5 w-3.5 animate-bounce" /> Scroll to present the device
      </motion.p>
    </div>
  );
}

function BeatFrame({ visible, side, label, title, children }: { visible: boolean; side: "left" | "right"; label: string; title: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-y-0 flex items-center transition-all duration-700 ease-out",
        side === "left" ? "left-4 md:left-[6vw]" : "right-4 md:right-[6vw]",
        visible ? "translate-x-0 opacity-100" : cn("opacity-0", side === "left" ? "-translate-x-10" : "translate-x-10")
      )}
    >
      <div className="glass-deep w-[min(420px,86vw)] rounded-lg p-6 shadow-lift backdrop-blur-xl md:p-7">
        <p className="label-tech mb-2 flex items-center gap-2.5"><span className="inline-block h-px w-6 bg-crimson" />{label}</p>
        <h2 className="text-hero mb-4 text-[clamp(1.5rem,3vw,2.3rem)]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function SpecList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-white/[0.07]">
      {rows.map(([k, v], i) => (
        <div key={k} className="flex items-baseline justify-between gap-6 py-2.5" style={{ transitionDelay: `${i * 60}ms` }}>
          <dt className="label-tech !text-[9px]">{k}</dt>
          <dd className="num font-mono text-[12px] text-mist">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function LensCallout({ x, y, p, children }: { x: string; y: string; p: number; children: React.ReactNode }) {
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <div className="relative flex items-center gap-2">
        <span className="relative h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-crimson" />
          <span className="absolute -inset-1.5 animate-ping rounded-full border border-crimson/60" />
        </span>
        <svg width={p} height="20" className="overflow-visible" aria-hidden>
          <path d={`M0 10 L${p - 8} 10`} stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeDasharray="2 3" />
        </svg>
        <span className="whitespace-nowrap rounded-sm border border-white/12 bg-void/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-mist backdrop-blur-md">
          {children}
        </span>
      </div>
    </div>
  );
}

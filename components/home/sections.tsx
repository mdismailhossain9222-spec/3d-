'use client';
"use client";

/* All homepage storytelling sections. Each owns its own micro-interaction â€” no two share the same motion signature. */

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { ArrowRight, Aperture, Waves, ScanEye, Mic2, FileText, Sparkles, Zap, Bluetooth, Wifi, Globe2, Radio } from "lucide-react";
import { SectionHead, Reveal, Badge, TabBar } from "@/components/ui/bits";
import { useCountUp } from "@/lib/hooks";
import { Countdown } from "@/lib/countdown";
import { formatTk } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductCardView, ProductView } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";
import { btnGhost, btnPrimary } from "@/components/home/hero";

const shell = "mx-auto w-full max-w-[1380px] px-4 md:px-8";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• DESIGN â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const HOTSPOTS = [
  { key: "camera", x: 33, y: 24, label: "Adaptive Optics housing", body: "Sapphire-covered, 0.01mm-tolerance island, laser-aligned in a climate-locked room.", img: "/renders/macro-camera.jpg" },
  { key: "frame", x: 78, y: 52, label: "FAISTOFlex frame", body: "Forged, then bead-blasted and vapour-polished â€” a satin skin that resists fingerprints.", img: "/renders/macro-frame.jpg" },
  { key: "glass", x: 52, y: 74, label: "Etched crystal back", body: "Nine layers of nano-ceramic, screen-printed and hand-inspected. Crimson is fired, not painted.", img: "/renders/back-crimson.jpg" },
  { key: "button", x: 86, y: 33, label: "Machined controls", body: "Single-piece alloy key travel, tuned to a 0.35mm click with 62-gram actuation.", img: "/renders/macro-frame.jpg" },
  { key: "speaker", x: 50, y: 92, label: "Symmetric acoustics", body: "Dual front-firing drivers vented through the USB-C bay. 15 dB louder, 3 dB cleaner.", img: "/renders/back-obsidian.jpg" },
];

export function DesignSection() {
  const [active, setActive] = useState<string | null>("camera");
  const spot = HOTSPOTS.find((h) => h.key === active) ?? HOTSPOTS[0];
  return (
    <section className="relative py-24 md:py-32" aria-labelledby="design-h">
      <div className={shell}>
        <SectionHead kicker="Design Â· 01" title={<span id="design-h">Form, without<br />compromise.</span>} sub="Every surface was argued over for months. Explore the details that never made the highlight reel â€” tap a marker." />

        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1.25fr_1fr]">
          <Reveal className="relative">
            <div className="group relative overflow-hidden rounded-lg border border-white/[0.07] bg-gradient-to-b from-iron/70 to-abyss">
              <div className="pointer-events-none absolute inset-0 crimson-atmosphere opacity-70" />
              <div className="relative aspect-[16/11]">
                <img src="/renders/angle-obsidian.jpg" alt="FAISTOF ONE on a dark reflective surface" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                {/* highlight lens around active hotspot */}
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute h-40 w-40 rounded-full border border-crimson/50 [background:radial-gradient(circle,rgba(215,25,32,0.16),transparent_65%)]"
                  animate={{ left: `${spot.x}%`, top: `${spot.y}%`, x: "-50%", y: "-50%" }}
                  transition={{ type: "spring", stiffness: 130, damping: 20 }}
                />
                {HOTSPOTS.map((h) => (
                  <button
                    key={h.key}
                    onMouseEnter={() => setActive(h.key)}
                    onFocus={() => setActive(h.key)}
                    onClick={() => setActive(h.key)}
                    aria-label={h.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                  >
                    <span className="relative grid h-7 w-7 place-items-center">
                      <span className={cn("absolute inset-0 rounded-full border transition-all duration-300", active === h.key ? "scale-75 border-crimson bg-crimson/80" : "border-white/50 bg-white/10 backdrop-blur-sm")} />
                      <span className={cn("h-1 w-1 rounded-full bg-white transition-opacity", active === h.key ? "" : "opacity-0")} />
                      {active !== h.key && <span className="absolute inset-0 animate-ping rounded-full border border-white/15 [animation-duration:3s]" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
              <span>{spot.label}</span>
              <span>FIG. 01 â€” {HOTSPOTS.findIndex((h) => h.key === active) + 1}/5</span>
            </div>
          </Reveal>

          <div className="flex min-h-[380px] flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={spot.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="glass-deep overflow-hidden rounded-lg"
              >
                <div className="relative h-44 overflow-hidden border-b border-white/[0.07]">
                  <img src={spot.img} alt={spot.label} className="h-full w-full object-cover" />
                  <span className="absolute left-4 top-4"><Badge tone="crimson">Detail</Badge></span>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-semibold">{spot.label}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ash">{spot.body}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <ul className="mt-auto grid grid-cols-2 gap-2 pt-6">
              {HOTSPOTS.map((h) => (
                <li key={h.key}>
                  <button
                    onClick={() => setActive(h.key)}
                    className={cn(
                      "w-full rounded-sm border px-3 py-2.5 text-left font-mono text-[10.5px] uppercase tracking-[0.14em] transition-all",
                      active === h.key ? "border-crimson/60 bg-crimson/10 text-white" : "border-white/10 text-ash hover:border-white/30 hover:text-mist"
                    )}
                  >
                    {h.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• PERFORMANCE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const STATS = [
  { v: 4.2, suf: " GHz", label: "Prime core, sustained", dec: 1 },
  { v: 16, suf: " GB", label: "LPDDR5X @ 9600", dec: 0 },
  { v: 1.2, suf: "M+", label: "Benchmark class", dec: 1 },
  { v: 120, suf: " FPS", label: "Peak gaming frame rate", dec: 0 },
  { v: 45, suf: "%", label: "Faster AI processing", dec: 0 },
];

function StatCell({ s, i }: { s: (typeof STATS)[number]; i: number }) {
  const { ref, val } = useCountUp<HTMLParagraphElement>(s.v, 1700 + i * 120);
  return (
    <div className="relative px-5 py-8 text-center">
      <p ref={ref} className="num font-display text-[clamp(1.7rem,3.6vw,2.9rem)] font-bold leading-none">
        {val.toFixed(s.dec)}
        <span className="text-[0.55em] text-crimson">{s.suf}</span>
      </p>
      <p className="label-tech mt-3 !text-[9px]">{s.label}</p>
    </div>
  );
}

export function PerformanceSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/[0.05] py-24 md:py-32" aria-labelledby="perf-h">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(50%_60%_at_80%_20%,rgba(215,25,32,0.08),transparent_70%)]" />
      <div className={shell}>
        <SectionHead kicker="Performance Â· 02" title={<span id="perf-h">Built for<br />what&apos;s next.</span>} sub="Vertex 900 does not sprint â€” it holds the line. Sustained clocks, engineered thermals, zero narrative about throttling." right={<Badge tone="outline">Vertex 900 Â· 4nm</Badge>} />

        <div className="mt-12 grid gap-3 rounded-lg border border-white/[0.07] bg-abyss/60 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-white/[0.06]">
          {STATS.map((s, i) => <StatCell key={s.label} s={s} i={i} />)}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr]">
          <PerfGraph />
          <ThermalViz />
        </div>
      </div>
    </section>
  );
}

function PerfGraph() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => { setT(performance.now() / 28); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const pts = useMemo(() => [...Array(48)].map((_, i) => {
    const x = (i / 47) * 100;
    const fs = 120 - Math.max(0, Math.sin((i + t) / 34)) * 6 - (Math.random() < 0.06 ? Math.random() * 4 : 0);
    return [x, 100 - ((fs - 96) / 26) * 100] as const;
  }), [t]);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L100,100 L0,100 Z`;
  return (
    <div className="relative h-64 overflow-hidden rounded-lg border border-white/[0.07] bg-gradient-to-b from-carbon to-abyss p-5">
      <div className="flex items-center justify-between">
        <p className="label-tech">Realtime FPS â€” 30-min sustained session</p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />LIVE</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 h-[calc(100%-2rem)] w-full">
        <defs>
          <linearGradient id="pg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(215,25,32,0.35)" />
            <stop offset="100%" stopColor="rgba(215,25,32,0)" />
          </linearGradient>
        </defs>
        {[25, 50, 75].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />)}
        <line x1="0" x2="100" y1="15" y2="15" stroke="rgba(255,255,255,0.14)" strokeDasharray="2 2" strokeWidth="0.4" />
        <text x="1" y="12" fill="#7d7d7d" fontSize="4" fontFamily="monospace">120fps</text>
        <path d={area} fill="url(#pg)" />
        <path d={path} fill="none" stroke="#D71920" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
      <div className="absolute bottom-3 right-4 num font-mono text-[10px] text-ash">min 108 Â· avg 117.4 Â· max 120</div>
    </div>
  );
}

function ThermalViz() {
  return (
    <div className="relative h-64 overflow-hidden rounded-lg border border-white/[0.07] bg-gradient-to-b from-carbon to-abyss p-5">
      <p className="label-tech">Thermal envelope Â· VaporGrid 4000mmÂ²</p>
      <div className="relative mx-auto mt-4 h-40 w-40">
        <div className="absolute inset-0 animate-[thermal_4s_ease-in-out_infinite] rounded-full [background:radial-gradient(circle,rgba(215,25,32,0.65),rgba(215,25,32,0.12)_55%,transparent_70%)] blur-[6px]" />
        <div className="absolute inset-5 rounded-full border border-white/10" />
        <div className="absolute inset-10 rounded-full border border-white/10" />
        <div className="absolute inset-16 grid place-items-center rounded-full border border-crimson/40 bg-void/70">
          <span className="num font-mono text-sm text-white">38.4Â°C</span>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-ash">Surface peak after 30 min at 120 FPS: <span className="text-mist">+6.2Â°C</span></p>
      <style>{`@keyframes thermal{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.12);opacity:1}}`}</style>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CAMERA â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const LENSES = [
  { key: "main", label: "Main", focal: "35mm", f: "f/1.4", img: "/renders/sample-night.jpg", meta: "108MP Â· 1/1.3\" Â· pixel-binned 2.4Âµm", caption: "Old Dhaka, 23:40 â€” zero tripod" },
  { key: "wide", label: "Ultra Wide", focal: "14mm", f: "f/1.9", img: "/renders/sample-ultrawide.jpg", meta: "50MP Â· 114Â° FoV Â· AF macro", caption: "Sajek ridge, last light" },
  { key: "tele", label: "Telephoto", focal: "120mm", f: "f/2.8", img: "/renders/sample-portrait.jpg", meta: "10MP periscope Â· 3Ã— Â· OIS 2.0", caption: "8-second portrait stack" },
];

export function CameraSection() {
  const [lens, setLens] = useState("main");
  const [zoom, setZoom] = useState(1);
  const [night, setNight] = useState(true);
  const cur = LENSES.find((l) => l.key === lens)!;
  return (
    <section className="relative py-24 md:py-32" aria-labelledby="cam-h">
      <div className={shell}>
        <SectionHead
          kicker="Camera Â· 03"
          title={<span id="cam-h">See what<br />others miss.</span>}
          sub="Three calibrated instruments, one color science. Change the lens and the whole frame follows."
          right={
            <div className="flex flex-col items-end gap-3">
              <TabBar idPrefix="cam" tabs={LENSES.map((l) => ({ key: l.key, label: l.label }))} active={lens} onChange={setLens} />
            </div>
          }
        />

        <Reveal className="mt-10">
          <div className="group relative aspect-[16/9] overflow-hidden rounded-lg border border-white/[0.07] bg-abyss">
            <AnimatePresence>
              {LENSES.map((l) => (
                l.key === lens && (
                  <motion.img
                    key={l.img}
                    src={l.img}
                    alt={`${l.label} sample â€” ${l.caption}`}
                    initial={{ opacity: 0, filter: "blur(14px)", scale: 1.04 }}
                    animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)", scale: 1.02 }}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700"
                    style={{ transform: `scale(${zoom})`, filter: night ? "brightness(1)" : "brightness(0.82) contrast(1.05)" }}
                  />
                )
              ))}
            </AnimatePresence>
            {/* viewfinder furniture */}
            <div className="pointer-events-none absolute inset-4 border border-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
              {[["0", "0"], ["100%", "0"], ["0", "100%"], ["100%", "100%"]].map(([x, y]) => (
                <span key={`${x}${y}`} className="absolute h-4 w-4 border-crimson" style={{ left: x, top: y, transform: "translate(-50%,-50%)", borderWidth: 0, borderLeft: x === "0" ? "2px solid" : 0, borderRight: x === "100%" ? "2px solid" : 0, borderTop: y === "0" ? "2px solid" : 0, borderBottom: y === "100%" ? "2px solid" : 0 }} />
              ))}
              <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 border border-white/25"><span className="absolute inset-[38%] bg-crimson/80" /></span>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-black/85 to-transparent p-4 pt-16 md:p-6">
              <div>
                <p className="num font-mono text-[10.5px] tracking-widest text-mist">{cur.meta}</p>
                <p className="mt-1 font-display text-sm text-white">â€œ{cur.caption}â€</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-sm border border-white/15 bg-black/40 px-2 py-1 font-mono text-[10px] text-mist backdrop-blur">{cur.focal} {cur.f} ISO125 1/17s</span>
              </div>
            </div>
            {/* controls */}
            <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
              <div className="flex overflow-hidden rounded-full border border-white/15 bg-black/45 backdrop-blur">
                {[1, 2, 3, 10].map((z) => (
                  <button key={z} onClick={() => setZoom(z === 10 && lens !== "tele" ? 2.2 : z)} aria-pressed={zoom === z || (z === 10 && zoom > 2)} aria-label={`Zoom ${z}Ã—`} className={cn("px-2.5 py-1 font-mono text-[10px] transition-colors", (zoom === z || (z === 10 && zoom > 2)) ? "bg-crimson text-white" : "text-mist hover:bg-white/10")}>
                    {z}Ã—
                  </button>
                ))}
              </div>
              <button
                onClick={() => setNight((n) => !n)}
                aria-pressed={night}
                className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] backdrop-blur transition-all", night ? "border-amber-300/50 bg-amber-300/15 text-amber-200" : "border-white/15 bg-black/45 text-mist")}
              >
                NightSight {night ? "ON" : "OFF"}
              </button>
            </div>
          </div>
        </Reveal>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            { icon: <Sparkles className="h-4 w-4" />, t: "AI Object Erase", b: "Brush a region in gallery; the model rebuilds parallax, reflections and grain." },
            { icon: <Aperture className="h-4 w-4" />, t: "TrueTone Skin", b: "A 2.1M-face color library keeps complexions honest under any light source." },
            { icon: <ScanEye className="h-4 w-4" />, t: "Cinematic Lock", b: "Subject tracking across three lenses â€” rack focus, no cut, no cheating." },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 0.08}>
              <div className="glass group flex h-full items-start gap-3.5 rounded-md p-4 transition-colors hover:border-crimson/30">
                <span className="mt-0.5 text-crimson">{c.icon}</span>
                <div>
                  <p className="font-display text-[13.5px] font-semibold">{c.t}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ash">{c.b}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• DISPLAY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function DisplaySection() {
  const [hz, setHz] = useState(120);
  const [brightness, setBrightness] = useState(72);
  const [hdr, setHdr] = useState(true);
  const x = useJudderBox(hz);
  return (
    <section className="relative border-y border-white/[0.05] bg-[#050506] py-24 md:py-32" aria-labelledby="disp-h">
      <div className={shell}>
        <SectionHead kicker="Display Â· 04" title={<span id="disp-h">Every pixel,<br />alive.</span>} sub="LumenCore is our 8T LTPO stack: one to a hundred and twenty hertz, decided per frame, per pixel." right={<Badge tone="outline">QHD+ Â· 525 PPI</Badge>} />

        <div className="mt-12 grid gap-3 lg:grid-cols-[1.15fr_1fr]">
          {/* refresh-rate demo */}
          <Reveal className="overflow-hidden rounded-lg border border-white/[0.07] bg-abyss">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <p className="label-tech">Refresh demo â€” watch the marker</p>
              <div className="flex gap-1" role="group" aria-label="Refresh rate">
                {[60, 90, 120].map((f) => (
                  <button key={f} onClick={() => setHz(f)} aria-pressed={hz === f} className={cn("rounded-sm px-3 py-1 font-mono text-[11px] transition-all", hz === f ? "bg-crimson text-white shadow-crim" : "text-ash hover:bg-white/[0.07] hover:text-mist")}>{f}Hz</button>
                ))}
              </div>
            </div>
            <div className="relative h-52 overflow-hidden">
              <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <motion.div style={{ x }} className="absolute left-8 top-1/2 -translate-y-1/2" aria-hidden>
                <div className="grid h-14 w-14 place-items-center rounded-md bg-gradient-to-br from-crimson to-[#7d0c11] shadow-crim">
                  <Zap className="h-5 w-5 text-white" />
                </div>
              </motion.div>
              <div className="num absolute bottom-4 right-5 font-mono text-[11px] text-ash">frame pacing: <span className={hz === 120 ? "text-emerald-400" : hz === 90 ? "text-amber-300" : "text-ember"}>{hz === 120 ? "imperceptible" : hz === 90 ? "minor" : "visible"}</span></div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06] text-center">
              {[["1â€“120Hz", "LTPO 3.0"], ["0.001s", "pixel response"], ["240Hz", "touch sampling"]].map(([v, l]) => (
                <div key={l} className="px-2 py-3"><p className="num font-mono text-[13px] font-semibold">{v}</p><p className="label-tech mt-1 !text-[8px]">{l}</p></div>
              ))}
            </div>
          </Reveal>

          {/* brightness + color */}
          <Reveal delay={0.1} className="flex flex-col gap-3">
            <div className="relative flex-1 overflow-hidden rounded-lg border border-white/[0.07] bg-abyss p-5">
              <p className="label-tech">Peak brightness â€” drag to feel HDR</p>
              <div className="relative mt-4 aspect-[16/8] overflow-hidden rounded-md border border-white/[0.06]">
                <img src="/renders/front-display.jpg" alt="Display brightness demonstration" className="h-full w-full object-cover transition-[filter] duration-150" style={{ filter: `brightness(${0.35 + (brightness / 100) * 1.35}) contrast(${hdr ? 1.18 : 1}) saturate(${hdr ? 1.15 : 1})` }} />
                <div className="pointer-events-none absolute inset-0 transition-opacity duration-200" style={{ opacity: brightness / 130, background: `radial-gradient(60% 80% at 50% 50%, rgba(255,235,220,${brightness / 240}), transparent 70%)` }} />
                <span className="num absolute right-3 top-3 rounded-sm bg-black/50 px-2 py-0.5 font-mono text-[11px] backdrop-blur">{Math.round((brightness / 100) * 3000)} nits</span>
              </div>
              <input
                type="range" min={5} max={100} value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                aria-label="Simulated brightness"
                className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#D71920] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-crimson [&::-webkit-slider-thumb]:shadow-crim"
              />
              <div className="mt-3 flex items-center justify-between">
                <button onClick={() => setHdr((v) => !v)} aria-pressed={hdr} className={cn("rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all", hdr ? "border-crimson/60 bg-crimson/15 text-white" : "border-white/15 text-ash")}>HDR10+ {hdr ? "on" : "off"}</button>
                <p className="text-[10.5px] text-ash">Î”E &lt; 1.0 factory calibrated</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/[0.07] bg-abyss p-4">
                <p className="label-tech mb-2">sRGB</p>
                <div className="h-10 rounded-sm [background:linear-gradient(90deg,#f43f5e,#f59e0b,#22c55e,#3b82f6)]" />
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-abyss p-4">
                <p className="label-tech mb-2">P3 Â· 100%</p>
                <div className="h-10 rounded-sm [background:linear-gradient(90deg,#ff2d55,#ffb347,#4ade80,#60a5fa,#c084fc)]" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Box animated through a MotionValue updated at exactly `hz` steps/second â€” judder is real, visible and honest. */
function useJudderBox(hz: number) {
  const x = useMotionValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    let raf = 0;
    let last = -Infinity;
    const T = 4200; // ms per round trip
    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      if (reduced) return;
      if (t - last < 1000 / hz - 0.7) return;
      last = t;
      const p = (t % T) / T;
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      const w = Math.min(560, window.innerWidth * 0.36);
      x.set(eased * w);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [hz, reduced, x]);
  return x;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• BATTERY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function BatterySection() {
  const [level, setLevel] = useState(18);
  const [charging, setCharging] = useState(false);
  const [minutes, setMinutes] = useState(0);
  useEffect(() => {
    if (!charging) return;
    const id = setInterval(() => {
      setLevel((l) => {
        if (l >= 100) { setCharging(false); return 100; }
        return Math.min(100, l + 1.8);
      });
      setMinutes((m) => m + 0.43);
    }, 100);
    return () => clearInterval(id);
  }, [charging]);

  return (
    <section className="relative py-24 md:py-32" aria-labelledby="batt-h">
      <div className={shell}>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHead kicker="Endurance Â· 05" title={<span id="batt-h">Power that<br />keeps up.</span>} sub="5400mAh of dual-cell CryoCell, engineered around two ideas: never charge before you need to, and never take longer than you have to." />
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[["24 min", "0 â†’ 100% wired"], ["50W", "MagLift wireless"], ["90%", "health at 1600 cycles"]].map(([v, l]) => (
                <div key={l} className="rounded-md border border-white/[0.07] bg-abyss px-3 py-4 text-center">
                  <p className="num font-display text-lg font-bold">{v}</p>
                  <p className="label-tech mt-1 !text-[8px]">{l}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => { setCharging(true); setMinutes(0); }}
                disabled={charging || level >= 100}
                className={cn(btnPrimary, level >= 100 && "!bg-emerald-600 opacity-90")}
              >
                {charging ? "HyperCharge activeâ€¦" : level >= 100 ? "Fully charged âœ“" : "Simulate HyperCharge"} <Zap className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => { setCharging(false); setLevel(18); setMinutes(0); }} className={btnGhost}>Reset demo</button>
            </div>
          </div>

          <Reveal className="relative overflow-hidden rounded-lg border border-white/[0.07] bg-gradient-to-b from-carbon to-abyss p-8">
            <div className="pointer-events-none absolute inset-0 transition-opacity duration-500" style={{ opacity: charging ? 1 : 0.2, background: "radial-gradient(50% 60% at 50% 100%, rgba(215,25,32,0.25), transparent 70%)" }} />
            <div className="relative mx-auto flex h-72 w-40 items-end justify-center rounded-2xl border-2 border-white/20 p-1.5">
              <div className="absolute -top-3 left-1/2 h-2.5 w-14 -translate-x-1/2 rounded-t-md bg-white/20" />
              <motion.div
                className={cn("w-full rounded-xl", level > 85 ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : "bg-gradient-to-t from-[#8e0f14] via-crimson to-ember")}
                animate={{ height: `${level}%` }}
                transition={{ ease: "linear", duration: 0.12 }}
              >
                <div className={cn("absolute inset-x-0 bottom-0 opacity-60", charging && "animate-scan")} style={{ height: `${level}%` }}>
                  <div className="h-1 w-full bg-white/60 blur-[2px]" />
                </div>
              </motion.div>
              <div className="absolute inset-0 grid place-items-center">
                <AnimatePresence mode="wait">
                  <motion.p key={Math.round(level)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("num text-4xl font-bold", level > 40 ? "text-white" : "text-white")}>
                    {Math.round(level)}<span className="text-lg">%</span>
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="label-tech !text-[9px]">Wired Â· 100W</p>
                <p className="num font-mono text-[13px] text-mist">{charging ? `+${Math.min(100, Math.round(minutes * 4.17))}% in ${minutes.toFixed(1)} min` : "idle Â· 0:00 elapsed"}</p>
              </div>
              <div className="flex items-end gap-0.5" aria-hidden>
                {[...Array(14)].map((_, i) => (
                  <motion.span key={i} className="w-1 rounded-full bg-crimson/80" animate={charging ? { height: [6, 6 + ((i * 7) % 26), 6] } : { height: 6 }} transition={{ duration: 1.1, repeat: charging ? Infinity : 0, delay: i * 0.07, ease: "easeInOut" }} style={{ height: 6 }} />
                ))}
              </div>
            </div>
            <p className="mt-3 text-[11px] text-ash">Battery health 96% Â· peak performance score 100 Â· adaptive charging learns your alarm.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• AI â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const AI_FEATURES = [
  { key: "enhance", label: "Photo Enhance", desc: "Generative relight â€” shadows open, highlights stay honest.", icon: <Sparkles className="h-4 w-4" /> },
  { key: "erase", label: "Object Erase", desc: "Brush, lift, gone. Backgrounds rebuilt at full resolution.", icon: <ScanEye className="h-4 w-4" /> },
  { key: "summar", label: "Summarize", desc: "Nine-page brief, four sentences, on-device.", icon: <FileText className="h-4 w-4" /> },
  { key: "call", label: "Call Clarity", desc: "Your voice, minus the bazaar.", icon: <Mic2 className="h-4 w-4" /> },
];

export function AISection() {
  const [f, setF] = useState("enhance");
  return (
    <section className="relative overflow-hidden border-y border-white/[0.05] bg-[#050506] py-24 md:py-32" aria-labelledby="ai-h">
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-crimson/10 blur-[120px]" />
      <div className={shell}>
        <SectionHead kicker="Halo AI Â· 06" title={<span id="ai-h">Intelligence,<br />built in.</span>} sub="The N3 Neural Core runs 44 TOPS locally. Your photos, your notes, your voice â€” none of it has to leave the device." />
        <div className="mt-10 grid gap-3 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-2">
            {AI_FEATURES.map((x) => (
              <button
                key={x.key}
                onClick={() => setF(x.key)}
                aria-pressed={f === x.key}
                className={cn(
                  "group relative overflow-hidden rounded-md border px-4 py-4 text-left transition-all",
                  f === x.key ? "border-crimson/50 bg-crimson/[0.08]" : "border-white/[0.07] bg-abyss/40 hover:border-white/20"
                )}
              >
                <span className="flex items-center gap-2.5 font-display text-[13px] font-semibold">{x.icon}{x.label}</span>
                <span className="mt-1.5 block text-[11.5px] leading-snug text-ash">{x.desc}</span>
                {f === x.key && <motion.span layoutId="ai-edge" className="absolute inset-y-0 left-0 w-[2px] bg-crimson" />}
              </button>
            ))}
          </div>
          <div className="relative overflow-hidden rounded-lg border border-white/[0.07] bg-abyss">
            <AnimatePresence mode="wait">
              <motion.div key={f} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.01 }} transition={{ duration: 0.4 }} className="relative h-full min-h-[340px]">
                {f === "enhance" && <AIEnhanceDemo />}
                {f === "erase" && <AIEraseDemo />}
                {f === "summar" && <AISummarDemo />}
                {f === "call" && <AICallDemo />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function AIDemoShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <p className="label-tech border-b border-white/[0.06] px-5 py-3">{title}</p>
      <div className="p-5">{children}</div>
    </>
  );
}
function AIEnhanceDemo() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setP((x) => (x + 1) % 4), 700);
    return () => clearInterval(id);
  }, []);
  const lvl = [0.25, 0.55, 0.85, 1][p];
  return (
    <AIDemoShell title="halo://relight â€” generative pass">
      <div className="grid grid-cols-2 gap-3">
        <div className="relative aspect-video overflow-hidden rounded-md">
          <img src="/renders/sample-night.jpg" alt="Before enhancement" className="h-full w-full object-cover brightness-[0.7]" />
          <span className="absolute left-2 top-2 rounded-sm bg-black/60 px-1.5 py-0.5 font-mono text-[9px]">BEFORE</span>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-md">
          <img src="/renders/sample-night.jpg" alt="After enhancement" className="h-full w-full object-cover transition-[filter] duration-700" style={{ filter: `brightness(${0.8 + lvl * 0.35}) contrast(${1 + lvl * 0.12}) saturate(${1 + lvl * 0.2})` }} />
          <span className="absolute left-2 top-2 rounded-sm bg-crimson px-1.5 py-0.5 font-mono text-[9px]">AFTER</span>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10"><div className="h-full bg-crimson transition-all duration-700" style={{ width: `${lvl * 100}%` }} /></div>
        </div>
      </div>
      <p className="mt-3 font-mono text-[10.5px] text-ash">{["sampling ambient occlusion", "lifting shadows Â· no halo", "rebuilding specular highlights", "done â€” 0.8s, on device"][p]}</p>
    </AIDemoShell>
  );
}
function AIEraseDemo() {
  return (
    <AIDemoShell title="halo://erase â€” brush & lift">
      <div className="relative mx-auto aspect-video max-w-md overflow-hidden rounded-md">
        <img src="/renders/sample-ultrawide.jpg" alt="Landscape being edited" className="h-full w-full object-cover" />
        <motion.div
          aria-hidden
          className="absolute border-2 border-dashed border-crimson bg-crimson/10"
          initial={{ x: 10, y: 120, width: 40, height: 40, opacity: 0.4 }}
          animate={{ x: [10, 120, 210, 120], y: [120, 60, 100, 120], opacity: [0.4, 0.9, 0.5, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute bottom-2 left-2 rounded-sm bg-black/60 px-2 py-1 font-mono text-[9px] text-mist backdrop-blur">rebuilding: rock texture Â· sky gradient Â· grain</div>
      </div>
    </AIDemoShell>
  );
}
function AISummarDemo() {
  const [i, setI] = useState(0);
  const lines = ["Q3 board brief â€” 9 pages", "â†’ Launch margin holds at 22%.", "â†’ Component risk: AMOLED yield.", "â†’ Delta deal signed for Q4."];
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % 5), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <AIDemoShell title="halo://summarize â€” local LLM 4B">
      <div className="space-y-5 font-mono text-[12px] leading-relaxed">
        <p className="text-ash/70 line-through decoration-ash/30">{lines[0]}</p>
        {lines.slice(1).map((l, idx) => (
          <motion.p key={l} initial={{ opacity: 0, x: -8 }} animate={{ opacity: i > idx ? 1 : 0.15, x: i > idx ? 0 : -8 }} className={cn(idx < i ? "text-mist" : "text-ash/40")}>{l}</motion.p>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-3 text-[10.5px] text-ash">
        <span className="flex items-center gap-1.5"><span className={cn("h-1.5 w-1.5 rounded-full", i < 4 ? "animate-pulse bg-crimson" : "bg-emerald-400")} />{i < 4 ? "reading" : "complete Â· 2.1s"}</span>
        <span>Â· no network calls made</span>
      </div>
    </AIDemoShell>
  );
}
function AICallDemo() {
  return (
    <AIDemoShell title="halo://voice â€” 3-mic isolation">
      <div className="grid gap-3 sm:grid-cols-2">
        <Waveform seed="noise" label="street â€” before" tone="rgba(255,255,255,0.25)" busy />
        <Waveform seed="voice" label="you â€” after" tone="#D71920" />
      </div>
      <p className="mt-4 text-[11.5px] text-ash">Wind, traffic and cafÃ© hum are suppressed at 600 reads per second â€” your voice is reconstructed, not just amplified.</p>
    </AIDemoShell>
  );
}
function Waveform({ seed, label, tone, busy }: { seed: string; label: string; tone: string; busy?: boolean }) {
  const bars = useRef([...Array(42)].map((_, i) => 20 + Math.abs(Math.sin(i * (seed === "noise" ? 3.7 : 1.4))) * (seed === "noise" ? 80 : 46))).current;
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!busy) return;
    const id = setInterval(() => setPhase((p) => p + 1), 110);
    return () => clearInterval(id);
  }, [busy]);
  return (
    <div className="rounded-md border border-white/[0.07] bg-carbon p-3">
      <div className="flex h-16 items-center gap-[3px]">
        {bars.map((h, i) => (
          <span key={i} className="w-full rounded-full transition-[height] duration-150" style={{ height: `${busy ? (h + Math.sin((i + phase) * 1.9) * 24) % 96 : Math.max(6, h * 0.55)}%`, background: tone }} />
        ))}
      </div>
      <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ash">{label}</p>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CONNECTIVITY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function ConnectivitySection() {
  const nodes = [
    { id: "5G", icon: <Radio className="h-4 w-4" />, note: "SA/NSA Â· 4Ã—4 MIMO", a: -90 },
    { id: "Wi-Fi 7", icon: <Wifi className="h-4 w-4" />, note: "tri-band Â· 5.8 Gbps", a: -30 },
    { id: "BT 5.4", icon: <Bluetooth className="h-4 w-4" />, note: "LE Audio Â· Auracast", a: 30 },
    { id: "GNSS", icon: <Globe2 className="h-4 w-4" />, note: "dual-band L1+L5", a: 90 },
    { id: "NFC", icon: <Waves className="h-4 w-4" />, note: "card emu + reader", a: 150 },
    { id: "USB-C4", icon: <Zap className="h-4 w-4" />, note: "40Gbps Â· DP 2.1", a: 210 },
  ];
  return (
    <section className="relative py-24 md:py-32" aria-labelledby="conn-h">
      <div className={shell}>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHead kicker="Connectivity Â· 07" title={<span id="conn-h">The whole<br />ecosystem, linked.</span>} sub="A phone is the beginning of a network. FAISTOF devices find each other instantly, hand off mid-task and stay in sync to the second." />
            <div className="mt-7 flex flex-wrap gap-2">
              {["Watch handoff", "Buds auto-switch", "Continuity clipboard", "Find My precision"].map((t) => (
                <span key={t} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] text-mist">{t}</span>
              ))}
            </div>
          </div>
          <Reveal className="relative mx-auto aspect-square w-full max-w-[520px]">
            <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
              {[160, 120, 80].map((r, i) => (
                <circle key={r} cx="200" cy="200" r={r} fill="none" stroke={`rgba(255,255,255,${0.10 - i * 0.025})`} strokeDasharray={i === 1 ? "3 5" : "none"} />
              ))}
              <motion.g animate={{ rotate: 360 }} transition={{ duration: 42, repeat: Infinity, ease: "linear" }}>
                {nodes.map((n) => {
                  const rad = (n.a * Math.PI) / 180;
                  const x = 200 + Math.cos(rad) * 160, y = 200 + Math.sin(rad) * 160;
                  return (
                    <g key={n.id}>
                      <line x1="200" y1="200" x2={x} y2={y} stroke="rgba(215,25,32,0.25)" strokeWidth="1" strokeDasharray="4 4" />
                      <motion.circle r="2.6" fill="#ff3138" initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "100%" }} transition={{ duration: 2.6 + (n.a % 7) / 10, repeat: Infinity, ease: "linear" }} style={{ offsetPath: `path("M200 200 L${x} ${y}")` }} />
                      <motion.g animate={{ rotate: -360 }} transition={{ duration: 42, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "200px 200px" }}>
                        <circle cx={x} cy={y} r="24" fill="rgba(10,10,12,0.9)" stroke="rgba(255,255,255,0.14)" />
                        <foreignObject x={x - 82} y={y - 12} width="164" height="26">
                          <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "#cfcfcf" }}>
                            <span className="text-crimson">{n.note}</span>
                          </div>
                        </foreignObject>
                        <foreignObject x={x - 12} y={y - 12} width="24" height="24">
                          <div className="grid h-6 w-6 place-items-center text-white/85 [&_svg]:h-4 [&_svg]:w-4">{n.icon}</div>
                        </foreignObject>
                      </motion.g>
                    </g>
                  );
                })}
              </motion.g>
              <rect x="168" y="140" width="64" height="120" rx="14" fill="#0a0a0c" stroke="rgba(215,25,32,0.6)" />
              <rect x="174" y="148" width="52" height="104" rx="9" fill="#D71920" opacity="0.14" />
              <text x="200" y="206" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace" letterSpacing="2">FAISTOF</text>
            </svg>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• COLOR COLLECTION â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function ColorSection({ product }: { product: ProductView | null }) {
  const [i, setI] = useState(0);
  const colors = product?.colors ?? [];
  const c = colors[i];
  const images = product?.images ?? [];
  const img = (c && images.find((x) => x.colorKey === c.key)) ?? images[0];
  const price = (product?.basePrice ?? 14990000) + (c?.priceDelta ?? 0);
  return (
    <section className="relative overflow-hidden border-y border-white/[0.05] py-24 md:py-32" aria-labelledby="color-h" id="colors">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ background: `radial-gradient(55% 45% at 50% 60%, ${c ? hexA(c.hex, 0.16) : "rgba(140,20,24,0.14)"}, transparent 70%)` }}
        transition={{ duration: 1 }}
      />
      <div className={cn(shell, "relative")}>
        <SectionHead kicker="Finishes Â· 08" title={<span id="color-h">Four moods.<br />One character.</span>} sub="Each finish is a different material conversation: smoked crystal, fired crimson, bead-blast titanium, satin silver." />

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div className="relative order-2 h-[420px] lg:order-1 lg:h-[520px]">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={c?.key ?? "obsidian"}
                src={img?.url ?? "/renders/hero-obsidian.jpg"}
                alt={`FAISTOF ONE in ${c?.label ?? "Obsidian"}`}
                initial={{ opacity: 0, scale: 1.05, filter: "blur(16px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 mx-auto h-full w-auto object-contain drop-shadow-[0_50px_60px_rgba(0,0,0,0.8)]"
              />
            </AnimatePresence>
          </div>

          <div className="order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div key={c?.key} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <p className="label-tech mb-2">Selected finish</p>
                <h3 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-bold uppercase tracking-tight">{c?.label}</h3>
                <p className="num mt-2 font-mono text-[15px] text-ash">
                  {formatTk(price)}
                  {c?.priceDelta ? <span className="ml-2 text-[11px] text-crimson">+{formatTk(c.priceDelta)} edition surcharge</span> : <span className="ml-2 text-[11px] text-emerald-400">standard</span>}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex flex-wrap gap-3">
              {colors.map((col, ci) => (
                <button
                  key={col.key}
                  onClick={() => setI(ci)}
                  aria-pressed={i === ci}
                  className={cn(
                    "group flex items-center gap-3 rounded-md border px-4 py-3 transition-all duration-300",
                    i === ci ? "border-crimson/60 bg-crimson/[0.08] shadow-crim" : "border-white/10 hover:border-white/30"
                  )}
                >
                  <span className="h-7 w-7 rounded-full border border-white/20 transition-transform duration-300 group-hover:scale-110" style={{ background: col.hex }} />
                  <span className="text-left">
                    <span className="block font-display text-[12.5px] font-semibold">{col.label}</span>
                    <span className="num block font-mono text-[9.5px] text-ash">{col.priceDelta ? `+${formatTk(col.priceDelta)}` : "included"}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <Link href={`/product/faistof-one${c ? `?color=${c.key}` : ""}`} className={btnPrimary}>Configure with {c?.label ?? "finish"} <ArrowRight className="h-3.5 w-3.5" /></Link>
              <Link href="/compare" className={btnGhost}>Compare line-up</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• COLLECTION + DEALS TEASER + CTA â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export function CollectionSection({ products, accessories }: { products: ProductView[]; accessories: ProductView[] }) {
  return (
    <section className="relative py-24 md:py-32" aria-labelledby="lineup-h" id="collection">
      <div className={shell}>
        <SectionHead
          kicker="The line-up Â· 09"
          title={<span id="lineup-h">Choose your<br />instrument.</span>}
          right={<Link href="/shop" className={btnGhost}>All products <ArrowRight className="h-3.5 w-3.5" /></Link>}
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>

        <div className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <h3 className="font-display text-xl font-bold tracking-tight uppercase">The ecosystem</h3>
            <Link href="/accessories" className="font-mono text-[11px] uppercase tracking-[0.2em] text-crimson hover:underline">All accessories</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {accessories.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DealsTeaser({ deals }: { deals: ProductCardView[] }) {
  const flash = deals.find((d) => d.deal);
  return (
    <section className="relative overflow-hidden border-y border-white/[0.05] py-16">
      <div className={cn(shell, "relative flex flex-col items-start gap-8 lg:flex-row lg:items-center")}>
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(40%_80%_at_15%_50%,rgba(215,25,32,0.12),transparent_70%)]" />
        <div className="relative lg:w-[38%]">
          <Badge tone="crimson">Flash deal</Badge>
          <h3 className="mt-4 font-display text-[clamp(1.6rem,3vw,2.3rem)] font-bold uppercase leading-tight tracking-tight">Limited window, flagship pricing.</h3>
          {flash?.deal && (
            <p className="mt-3 flex items-center gap-3 text-[13px] text-ash">
              Ends in <Countdown endsAt={flash.deal.endsAt} />
            </p>
          )}
          <Link href="/deals" className={cn(btnPrimary, "mt-6")}>See all deals <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="relative grid w-full flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          {deals.slice(0, 3).map((d, i) => (
            <Reveal key={d.id} delay={i * 0.08}>
              <Link href={`/product/${d.slug}`} className="group flex items-center gap-4 rounded-md border border-white/[0.07] bg-abyss/70 p-3.5 transition-all hover:border-crimson/40 hover:bg-crimson/[0.05]">
                <img src={d.image} alt="" className="h-16 w-14 object-contain transition-transform duration-500 group-hover:scale-110" />
                <span className="min-w-0">
                  <span className="block truncate font-display text-[13px] font-semibold">{d.name}</span>
                  <span className="num mt-1 block font-mono text-[11.5px]">
                    <span className="text-crimson">{formatTk(d.basePrice)}</span>
                    {d.compareAtPrice && <span className="ml-2 text-ash line-through">{formatTk(d.compareAtPrice)}</span>}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClosingCTA() {
  return (
    <section className="relative overflow-hidden py-28 text-center md:py-40">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(46%_60%_at_50%_118%,rgba(215,25,32,0.4),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-crimson to-transparent" />
      <div className={cn(shell, "relative")}>
        <Reveal>
          <p className="label-tech mb-5">FAISTOF ONE Â· in stock, configured to order</p>
          <h2 className="text-hero mx-auto max-w-4xl text-[clamp(2.4rem,7.5vw,5.6rem)]">Own the precision.</h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/product/faistof-one" className={btnPrimary}>Configure FAISTOF ONE</Link>
            <Link href="/shop" className={btnGhost}>Visit store</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


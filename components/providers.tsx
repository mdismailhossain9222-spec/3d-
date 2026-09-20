"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/toast";
import { CommerceProvider } from "@/lib/store";
import { SplashLoader } from "@/components/splash-loader";

/** Lenis smooth scrolling — site-wide, disabled for reduced motion. */
function useLenis() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let api: { destroy: () => void; raf: (t: number) => void } | null = null;
    let rafId = 0;
    let alive = true;
    import("lenis").then(({ default: Lenis }) => {
      if (!alive) return;
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1 });
      const raf = (time: number) => {
        lenis.raf(time);
        const onScroll = () => {};
        void onScroll;
      };
      api = { destroy: () => lenis.destroy(), raf };
      const loop = (t: number) => { api?.raf(t); rafId = requestAnimationFrame(loop); };
      rafId = requestAnimationFrame(loop);
      // keep GSAP ScrollTrigger in sync with lenis-driven scroll
      lenis.on("scroll", () => {
        import("gsap/ScrollTrigger").then(({ default: ST }) => (ST as unknown as { update?: () => void }).update?.());
      });
    });
    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      api?.destroy();
    };
  }, []);
}

/** Subtle route-change progress line (fast, never blocks content). */
function RouteProgress() {
  const pathname = usePathname();
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(true);
    const t = setTimeout(() => setOn(false), 420);
    return () => clearTimeout(t);
  }, [pathname]);
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[150] h-[2px]">
      <div
        className={`fs-loader-bar h-full origin-left transition-transform duration-[420ms] ease-out ${on ? "scale-x-100" : "scale-x-0"}`}
      />
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  useLenis();
  return (
    <ToastProvider>
      <CommerceProvider>
        <RouteProgress />
        <SplashLoader />
        {children}
      </CommerceProvider>
    </ToastProvider>
  );
}

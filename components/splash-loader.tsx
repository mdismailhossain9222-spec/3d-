"use client";

import { useEffect, useState } from "react";

/** First-visit cinematic loader: black → logo → red progress line → curtain wipe. */
export function SplashLoader() {
  const [phase, setPhase] = useState<"none" | "in" | "out">("none");

  useEffect(() => {
    if (sessionStorage.getItem("fs_splash") === "1") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("fs_splash", "1");
      return;
    }
    setPhase("in");
    const t1 = setTimeout(() => setPhase("out"), 1500);
    const t2 = setTimeout(() => {
      setPhase("none");
      sessionStorage.setItem("fs_splash", "1");
    }, 2100);
    document.documentElement.style.overflow = "hidden";
    return () => { clearTimeout(t1); clearTimeout(t2); document.documentElement.style.overflow = ""; };
  }, []);

  if (phase === "none") return null;
  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[300] flex items-center justify-center bg-[#030303] transition-[transform,opacity] duration-500 [transition-timing-function:cubic-bezier(0.7,0,0.2,1)] ${phase === "out" ? "-translate-y-full" : ""}`}
    >
      <div className="flex flex-col items-center gap-7">
        <svg viewBox="0 0 64 64" className="h-14 w-14 animate-pulse-crim">
          <path d="M20 46V18h24l-4 7H28v6h12l-4 7H28v8z" fill="#ffffff" />
          <rect x="40" y="38" width="7" height="7" transform="rotate(45 43.5 41.5)" fill="#D71920" />
        </svg>
        <div className="relative h-px w-44 overflow-hidden bg-white/10">
          <span className="fs-loader-bar absolute inset-y-0 left-0 w-full origin-left animate-[splashbar_1.4s_cubic-bezier(0.4,0,0.2,1)_forwards]" />
        </div>
        <p className="label-tech animate-pulse-crim">ISMAIL</p>
      </div>
      <style>{`@keyframes splashbar{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
    </div>
  );
}
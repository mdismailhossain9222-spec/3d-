"use client";

import { useEffect } from "react";
import { RotateCcw, LifeBuoy } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[faistof:page-error]", error); }, [error]);
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-void px-4 text-center">
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(42%_40%_at_50%_58%,rgba(215,25,32,0.16),transparent_70%)]" />
      <div className="relative max-w-md">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-crimson/40 bg-crimson/10 text-crimson"><LifeBuoy className="h-6 w-6" /></div>
        <h1 className="mt-5 font-display text-2xl font-bold uppercase tracking-tight">Something broke the spell.</h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ash">
          An unexpected error reached us and our logs. Retrying usually resolves it — the storefront is stateless at the edge.
        </p>
        {error.digest && <p className="num mt-3 font-mono text-[10px] uppercase tracking-widest text-ash/70">ref {error.digest.slice(0, 12)}</p>}
        <button onClick={reset} className="mt-7 inline-flex h-11 items-center gap-2 rounded-sm bg-gradient-to-b from-crimson to-[#a80f15] px-7 font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-crim transition-all hover:from-ember active:scale-[0.97]">
          <RotateCcw className="h-3.5 w-3.5" />Try again
        </button>
      </div>
    </div>
  );
}

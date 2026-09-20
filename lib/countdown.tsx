"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Real-time countdown to an ISO date. Ticks every second. */
export function useCountdown(endsAt: string) {
  const [left, setLeft] = useState(() => compute(endsAt));
  useEffect(() => {
    const t = setInterval(() => setLeft(compute(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return left;
}

function compute(endsAt: string) {
  const ms = Math.max(0, new Date(endsAt).getTime() - Date.now());
  return {
    expired: ms <= 0,
    d: Math.floor(ms / 86_400_000),
    h: Math.floor(ms / 3_600_000) % 24,
    m: Math.floor(ms / 60_000) % 60,
    s: Math.floor(ms / 1000) % 60,
    ms,
  };
}

export function Countdown({ endsAt, compact, className }: { endsAt: string; compact?: boolean; className?: string }) {
  const t = useCountdown(endsAt);
  if (t.expired) return <span suppressHydrationWarning className={cn("font-mono text-[11px] text-ash", className)}>ended</span>;
  return (
    <span suppressHydrationWarning className={cn("num inline-flex items-center gap-0.5 font-mono text-[11px] tracking-wider text-snow", className)} aria-label={`${t.d} days ${t.h} hours remaining`}>
      {t.d > 0 && !compact && (<><Cell v={t.d} label="d" /> <Sep /> </>)}
      <Cell v={t.h} label="h" />
      <Sep />
      <Cell v={t.m} label="m" />
      <Sep />
      <Cell v={t.s} label="s" />
    </span>
  );
}

function Cell({ v, label }: { v: number; label?: string }) {
  return (
    <span className="inline-flex items-baseline gap-0.5 rounded-[3px] bg-white/[0.07] px-1.5 py-0.5">
      <span key={v} suppressHydrationWarning className="inline-block animate-[cdt_0.3s_ease-out]">{pad(v)}</span>
      {label && <span className="text-[8px] text-ash">{label}</span>}
    </span>
  );
}
const Sep = () => <span className="text-crimson/80">:</span>;
function pad(n: number) { return String(n).padStart(2, "0"); }

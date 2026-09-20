"use client";

import { motion } from "framer-motion";
import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const FLOW = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
const LABELS: Record<string, string> = {
  PLACED: "Placed", CONFIRMED: "Confirmed", PROCESSING: "Processing",
  SHIPPED: "Shipped", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered",
};

export function OrderTimeline({ status, events, compact }: { status: string; events?: { status: string; at: string; note?: string }[]; compact?: boolean }) {
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-3 rounded-md border border-ember/30 bg-ember/[0.06] px-4 py-3 text-[12.5px] text-ember">
        <X className="h-4 w-4" />This order was cancelled{events?.length ? ` — ${events[events.length - 1]?.note ?? ""}` : ""}.
      </div>
    );
  }
  const idx = Math.max(0, FLOW.indexOf(status as never));
  return (
    <ol className={cn("relative flex", compact ? "flex-row items-center gap-0" : "flex-col gap-0")}>
      {FLOW.map((s, i) => {
        const done = i <= idx;
        const current = i === idx;
        const at = events?.find((e) => e.status === s)?.at;
        const note = events?.find((e) => e.status === s)?.note;
        return (
          <li key={s} className={cn(compact ? "flex items-center" : "relative flex gap-4 pb-7 last:pb-0")}>
            {!compact && i < FLOW.length - 1 && (
              <span className="absolute left-[11px] top-7 h-[calc(100%-1.75rem)] w-px overflow-hidden bg-white/10">
                {done && <motion.span initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="block h-full w-full origin-top bg-gradient-to-b from-crimson to-ember" />}
              </span>
            )}
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 + i * 0.09, type: "spring", stiffness: 400, damping: 24 }}
              className={cn(
                "relative z-10 grid shrink-0 place-items-center rounded-full border",
                compact ? "h-5 w-5" : "h-6 w-6",
                done ? "border-crimson bg-crimson text-white shadow-crim" : "border-white/15 bg-void text-ash"
              )}
            >
              {done ? <Check className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} /> : <Clock className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />}
              {current && <motion.span className="absolute -inset-1 rounded-full border border-crimson/50" animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />}
            </motion.span>
            {compact ? (
              <div className="ml-2 mr-4 text-center">
                <p className={cn("text-[9.5px] font-semibold uppercase tracking-[0.1em]", done ? "text-mist" : "text-ash")}>{LABELS[s]}</p>
              </div>
            ) : (
              <div className="pt-0.5">
                <p className={cn("font-display text-[13px] font-semibold tracking-wide", done ? "text-white" : "text-ash")}>{LABELS[s]}</p>
                <p className="mt-0.5 text-[11.5px] text-ash">{note ?? (done ? (at ? new Date(at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—") : "Awaiting this stage")}</p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

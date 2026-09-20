"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { clamp } from "@/lib/utils";

/** Quantity stepper with animated digit transitions. */
export function Quantity({
  value, onChange, min = 1, max = 99, size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const step = (d: number) => {
    const next = clamp(value + d, min, max);
    if (next !== value) {
      onChange(next);
      window.dispatchEvent(new CustomEvent("fs:tick"));
    }
  };
  return (
    <div
      className="inline-flex items-center rounded-sm border border-white/12 bg-white/[0.05] p-0.5"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={`${px} grid place-items-center rounded-[3px] text-mist transition-all hover:bg-white/10 active:scale-90 disabled:opacity-30`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="relative w-9 overflow-hidden text-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: value > 0 ? "90%" : "-90%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: value > 0 ? "-90%": "90%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 550, damping: 38 }}
            className="num block font-mono text-[13px] font-semibold"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={`${px} grid place-items-center rounded-[3px] text-mist transition-all hover:bg-white/10 active:scale-90 disabled:opacity-30`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

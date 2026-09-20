"use client";

import Link from "next/link";
import { useCompare } from "@/lib/store";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/** Bottom dock that follows you while products are staged for comparison. */
export function CompareDock() {
  const cmp = useCompare();
  return (
    <AnimatePresence>
      {cmp.count > 0 && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-3 bottom-3 z-[140] mx-auto max-w-xl"
          role="region"
          aria-label="Comparison tray"
        >
          <div className="glass-deep flex items-center gap-3 rounded-md border border-white/12 p-2.5 shadow-lift">
            <span className="label-tech !text-[8.5px] pl-2">COMPARE</span>
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto no-scrollbar">
              {cmp.items.map((c) => (
                <span key={c.productId} className="flex shrink-0 items-center gap-1.5 rounded-sm border border-white/10 bg-white/[0.05] py-1 pl-2.5 pr-1 text-[11.5px] text-mist">
                  {c.name}
                  <button onClick={() => cmp.toggle(c)} aria-label={`Remove ${c.name} from comparison`} className="rounded-sm p-0.5 text-ash transition-colors hover:bg-white/10 hover:text-ember"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <button onClick={cmp.clear} className="shrink-0 px-2 text-[10.5px] font-mono uppercase tracking-wider text-ash transition-colors hover:text-white">Clear</button>
            <Link href="/compare" className="shrink-0 rounded-sm bg-gradient-to-b from-crimson to-[#a80f15] px-4 py-2 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-crim transition-all hover:from-ember active:scale-95">
              Compare ({cmp.count})
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

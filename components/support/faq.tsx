"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-lg border border-white/[0.07]">
      {items.map((f, i) => (
        <li key={f.q}>
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]">
            <span className="font-display text-[13.5px] font-semibold tracking-wide">{f.q}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 text-crimson transition-transform duration-300 ${open === i ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.p key="c" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden px-5 text-[13px] leading-relaxed text-ash">
                <span className="block pb-4">{f.a}</span>
              </motion.p>
            )}
          </AnimatePresence>
        </li>
      ))}
    </ul>
  );
}

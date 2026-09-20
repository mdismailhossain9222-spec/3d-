"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/** Slide-in side panel — used for cart, mobile nav and mobile filters. */
export function Drawer({
  open, onOpenChange, title, side = "right", children, footer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  side?: "left" | "right";
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.aside
                initial={{ x: side === "right" ? "102%" : "-102%" }}
                animate={{ x: 0 }}
                exit={{ x: side === "right" ? "102%" : "-102%" }}
                transition={{ type: "spring", stiffness: 330, damping: 36, mass: 0.9 }}
                className={`glass-deep fixed inset-y-0 ${side === "right" ? "right-0 border-l" : "left-0 border-r"} z-[130] flex w-full max-w-[440px] flex-col border-white/10`}
              >
                <header className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                  <Dialog.Title className="font-display text-sm font-semibold uppercase tracking-[0.18em]">
                    {title}
                  </Dialog.Title>
                  <Dialog.Close aria-label="Close panel" className="rounded-sm p-1.5 text-ash transition-all hover:rotate-90 hover:bg-white/10 hover:text-white">
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </header>
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
                {footer && <div className="border-t border-white/[0.07] bg-abyss/60 px-5 py-4">{footer}</div>}
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

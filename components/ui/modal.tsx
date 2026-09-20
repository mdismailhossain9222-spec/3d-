"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open, onOpenChange, title, children, wide,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
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
                transition={{ duration: 0.22 }}
                className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-[10px]"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.97, y: 12, filter: "blur(6px)" }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className={cn(
                  "glass-deep fixed left-1/2 top-1/2 z-[130] max-h-[88vh] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-white/10 shadow-lift",
                  wide ? "max-w-4xl" : "max-w-lg"
                )}
              >
                <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                  <Dialog.Title className="font-display text-sm font-semibold tracking-[0.18em] uppercase">
                    {title}
                  </Dialog.Title>
                  <Dialog.Close
                    aria-label="Close dialog"
                    className="rounded-sm p-1.5 text-ash transition-all hover:rotate-90 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Dialog.Close>
                </div>
                <div className="p-5">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

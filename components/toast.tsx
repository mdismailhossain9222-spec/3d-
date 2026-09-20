"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import {
  createContext, useCallback, useContext, useMemo, useRef, useState,
} from "react";

export type ToastKind = "success" | "error" | "warning" | "info";
type Toast = { id: number; kind: ToastKind; title: string; body?: string };

type Ctx = { push: (t: Omit<Toast, "id">) => void };
const ToastCtx = createContext<Ctx>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

const icons = {
  success: <CheckCircle2 className="h-[18px] w-[18px] text-crimson" />,
  error: <XCircle className="h-[18px] w-[18px] text-ember" />,
  warning: <AlertTriangle className="h-[18px] w-[18px] text-amber-500" />,
  info: <Info className="h-[18px] w-[18px] text-snow/70" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++seq.current;
    setItems((cur) => [...cur.slice(-3), { ...t, id }]);
    setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-5 right-4 z-[200] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2.5"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              layout
              initial={{ opacity: 0, x: 48, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              onClick={() => setItems((cur) => cur.filter((x) => x.id !== t.id))}
              className="glass-deep pointer-events-auto relative w-full overflow-hidden rounded-md border border-white/10 px-4 py-3 text-left shadow-lift"
            >
              <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-ember to-crimson" />
              <span className="flex items-start gap-2.5">
                <span className="mt-0.5">{icons[t.kind]}</span>
                <span>
                  <span className="block font-display text-[13px] font-semibold tracking-wide text-snow">
                    {t.title}
                  </span>
                  {t.body && <span className="mt-0.5 block text-xs leading-relaxed text-ash">{t.body}</span>}
                </span>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

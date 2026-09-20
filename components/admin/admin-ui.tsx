"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";

/** Fetch helper for admin panels — always no-store, always fresh. */
export function useAdmin<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(path, { cache: "no-store" });
      setData(await r.json());
    } catch {
      /* toast once */
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => { void load(); }, [load]);
  return { data, loading, reload: load };
}

/** Mutation helper: returns parsed body or throws with a human message. */
export async function mutate(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
  const r = await fetch(path, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.ok === false) throw new Error(d.error ?? `Request failed (${r.status})`);
  return d;
}

export function useMutator(path: string, reload: () => void) {
  const toast = useToast();
  return useCallback(async (method: "POST" | "PATCH" | "DELETE", body?: unknown, okMsg = "Done") => {
    try {
      await mutate(path, method, body);
      toast.push({ kind: "success", title: okMsg });
      reload();
      return true;
    } catch (e) {
      toast.push({ kind: "error", title: "Rejected", body: (e as Error).message });
      return false;
    }
  }, [path, reload, toast]);
}

export function AdminCard({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <section className={cn("glass-deep rounded-lg", className)}>
      {label && <h2 className="border-b border-white/[0.06] px-5 py-3.5 font-display text-[12px] font-bold uppercase tracking-[0.2em]">{label}</h2>}
      <div className={cn(label && "p-5")}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, delta, hint }: { label: string; value: string; delta?: number; hint?: string }) {
  return (
    <div className="glass rounded-lg p-4">
      <p className="label-tech">{label}</p>
      <p className="num mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-ash">
        {typeof delta === "number" && (
          <span className={delta >= 0 ? "text-emerald-400" : "text-ember"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</span>
        )}{" "}
        {hint}
      </p>
    </div>
  );
}

export function AdminTable({ head, rows, keyOf, dense }: {
  head: React.ReactNode[]; rows: React.ReactNode[][]; keyOf: (i: number) => string; dense?: boolean;
}) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr>{head.map((h, i) => <th key={i} className={cn("label-tech border-b border-white/[0.07] !text-[9px] whitespace-nowrap", dense ? "px-3 py-2" : "px-4 py-3", i > 0 && "text-right", i === head.length - 1 && "text-right")}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((cells, r) => (
            <motion.tr key={keyOf(r)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-white/[0.045] transition-colors last:border-0 hover:bg-white/[0.025]">
              {cells.map((c, ci) => <td key={ci} className={cn("text-[12.5px] text-mist", dense ? "px-3 py-2" : "px-4 py-3", ci > 0 && ci < cells.length ? "" : "", ci === cells.length - 1 && "text-right")}>{c}</td>)}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoadingBlock({ text = "Fetching live data…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[12px] text-ash">
      <Loader2 className="h-4 w-4 animate-spin text-crimson" />{text}
    </div>
  );
}

export function ErrorBlock({ text }: { text: string }) {
  return <p className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">{text}</p>;
}

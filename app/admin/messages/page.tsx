"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ChevronDown, Mail, MailOpen } from "lucide-react";
import { AdminCard, LoadingBlock, useAdmin, mutate } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/bits";
import { useToast } from "@/components/toast";
import { cn, fmtDateTime } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type Msg = { id: string; name: string; email: string; subject: string; body: string; handled: boolean; createdAt: string };
type List = { ok: boolean; messages: Msg[] };

export default function AdminMessagesPage() {
  const { data, loading, reload } = useAdmin<List>("/api/admin/messages");
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [onlyOpen, setOnlyOpen] = useState(false);

  const rows = (data?.messages ?? []).filter((m) => !onlyOpen || !m.handled);

  const toggle = async (m: Msg) => {
    try { await mutate("/api/admin/messages", "PATCH", { id: m.id, handled: !m.handled }); toast.push({ kind: "success", title: m.handled ? "Reopened" : "Marked handled" }); reload(); }
    catch (e) { toast.push({ kind: "error", title: "Failed", body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-tech">Inbox</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Messages</h1>
        </div>
        <button onClick={() => setOnlyOpen((v) => !v)} className={cn("rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors", onlyOpen ? "border-crimson bg-crimson/15 text-white" : "border-white/12 text-ash hover:text-mist")}>
          {onlyOpen ? "showing open only" : "show all"} · {data?.messages.filter((m) => !m.handled).length ?? 0} open
        </button>
      </div>

      {loading || !data ? <LoadingBlock text="Loading messages…" /> : rows.length === 0 ? (
        <p className="glass-deep rounded-lg py-14 text-center text-[12.5px] text-ash">Inbox zero. Send a test from <Link href="/contact" className="text-crimson hover:underline">/contact</Link>.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((m) => (
            <li key={m.id} className={cn("glass-deep overflow-hidden rounded-lg transition-colors", !m.handled && "border-crimson/25")}>
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button onClick={() => toggle(m)} aria-label={m.handled ? "Reopen" : "Mark handled"} className={cn("rounded-sm p-1.5 transition-colors", m.handled ? "text-emerald-400" : "text-ash hover:bg-white/10 hover:text-white")}>
                  {m.handled ? <Check className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </button>
                <button onClick={() => setOpenId(openId === m.id ? null : m.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span>
                    <span className="block truncate font-display text-[13px] font-semibold">{m.subject}</span>
                    <span className="num block truncate font-mono text-[10.5px] text-ash">{m.name} · {m.email}</span>
                  </span>
                  <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 text-ash transition-transform", openId === m.id && "rotate-180")} />
                </button>
                <span className="num text-[10.5px] text-ash">{fmtDateTime(m.createdAt)}</span>
                {!m.handled && <Badge tone="warn">new</Badge>}
              </div>
              <AnimatePresence initial={false}>
                {openId === m.id && (
                  <motion.div key="b" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
                    <div className="border-t border-white/[0.06] px-4 py-4">
                      <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-mist">{m.body}</p>
                      <div className="mt-3 flex justify-end gap-2">
                        <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="flex items-center gap-1.5 rounded-sm border border-white/12 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-mist transition-colors hover:border-crimson/50 hover:text-white"><MailOpen className="h-3 w-3" />Reply via mail</a>
                        <button onClick={() => toggle(m)} className="rounded-sm border border-crimson/40 bg-crimson/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-crimson transition-colors hover:bg-crimson/20">{m.handled ? "Reopen" : "Mark handled"}</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

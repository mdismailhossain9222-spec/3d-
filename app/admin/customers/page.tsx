"use client";

import { useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { AdminCard, AdminTable, LoadingBlock, useAdmin, mutate } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/bits";
import { formatTk } from "@/lib/money";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

type C = { id: string; name: string; email: string; role: string; disabled: boolean; emailVerified: boolean; orders: number; reviews: number; joinedAt: string; lifetimeValue: number };
type List = { ok: boolean; customers: C[] };

export default function AdminCustomersPage() {
  const [q, setQ] = useState("");
  const { data, loading, reload } = useAdmin<List>(`/api/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  const toast = useToast();

  const send = async (body: Record<string, unknown>, msg: string) => {
    try { await mutate("/api/admin/customers", "PATCH", body); toast.push({ kind: "success", title: msg }); reload(); }
    catch (e) { toast.push({ kind: "error", title: "Rejected", body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-tech">People</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Customers</h1>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ash" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email…" aria-label="Search customers" className="h-9 w-52 rounded-sm border border-white/10 bg-white/[0.05] pl-8 pr-3 text-[12px] placeholder:text-ash/70 focus:border-crimson/60 focus:outline-none" />
        </div>
      </div>

      {loading || !data ? <LoadingBlock text="Loading customers…" /> : (
        <AdminCard>
          <AdminTable
            head={["Person", "Joined", "Orders", "Reviews", "Lifetime value", "Access", ""]}
            rows={data.customers.map((c) => [
              <span key="n"><span className="block font-display text-[13px] font-semibold">{c.name}</span><span className="block text-[11px] text-ash">{c.email}{!c.emailVerified && " · unverified"}</span></span>,
              <span key="j" className="num text-[11px] text-ash">{new Date(c.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}</span>,
              <span key="o" className="num font-mono text-[12px]">{c.orders}</span>,
              <span key="r" className="num font-mono text-[12px]">{c.reviews}</span>,
              <span key="v" className="num font-mono text-[12px] text-mist">{formatTk(c.lifetimeValue)}</span>,
              <span key="a" className="flex justify-end gap-1">
                {c.role === "ADMIN" && <Badge tone="crimson">admin</Badge>}
                {c.disabled && <Badge tone="warn">disabled</Badge>}
              </span>,
              <span key="x" className="flex items-center justify-end gap-2 font-mono text-[9.5px] uppercase tracking-widest">
                <button onClick={() => send({ userId: c.id, disabled: !c.disabled }, c.disabled ? "Account re-enabled" : "Account disabled")} className={cn("rounded-sm border px-2 py-1 transition-colors", c.disabled ? "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10" : "border-ember/40 text-ember hover:bg-ember/10")}>{c.disabled ? "Enable" : "Disable"}</button>
                <button onClick={() => send({ userId: c.id, role: c.role === "ADMIN" ? "CUSTOMER" : "ADMIN" }, c.role === "ADMIN" ? "Admin rights removed" : "Admin rights granted")} className={cn("flex items-center gap-1 rounded-sm border px-2 py-1 transition-colors", c.role === "ADMIN" ? "border-white/15 text-ash hover:text-white" : "border-crimson/40 text-crimson hover:bg-crimson/10")}><ShieldCheck className="h-3 w-3" />{c.role === "ADMIN" ? "Demote" : "Promote"}</button>
              </span>,
            ])}
            keyOf={(i) => data.customers[i]?.id ?? String(i)}
          />
        </AdminCard>
      )}
    </div>
  );
}

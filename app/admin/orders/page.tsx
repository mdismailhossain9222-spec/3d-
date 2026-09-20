"use client";

import { useState } from "react";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { AdminCard, AdminTable, LoadingBlock, useAdmin } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/bits";
import { formatTk } from "@/lib/money";
import { cn } from "@/lib/utils";
import { OrderTimeline } from "@/components/account/order-timeline";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type OItem = { name: string; label: string; quantity: number; total: number };
type ORow = {
  id: string; number: string; status: string; paymentStatus: string; total: number; itemCount: number;
  createdAt: string; shipName: string; shipCity: string; user: { email: string; name: string } | null; items?: OItem[];
  timeline: { status: string; at: string; note?: string }[];
};
type List = { ok: boolean; orders: ORow[]; total: number; page: number; pages: number };

const FLOW = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
const FILTERS = ["ALL", ...FLOW, "CANCELLED"];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams();
  if (status !== "ALL") qs.set("status", status);
  if (q) qs.set("q", q);
  qs.set("page", String(page));
  const { data, loading, reload } = useAdmin<List>(`/api/admin/orders?${qs.toString()}`);

  const [detail, setDetail] = useState<ORow | null>(null);
  const setOrderStatus = async (id: string, next: string, note = "") => {
    const ok = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: next, note }) })
      .then(async (r) => { const d = await r.json(); if (!r.ok || d.ok === false) throw new Error(d.error); return true; })
      .catch((e) => { alert((e as Error).message); return false; });
    if (ok) { reload(); if (detail?.id === id) setDetail(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-tech">Fulfilment</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Orders</h1>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ash" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Number, name, email…" aria-label="Search orders" className="h-9 w-56 rounded-sm border border-white/10 bg-white/[0.05] pl-8 pr-3 text-[12px] placeholder:text-ash/70 focus:border-crimson/60 focus:outline-none" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f} role="tab" aria-selected={status === f} onClick={() => { setStatus(f); setPage(1); }} className={cn("rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors", status === f ? "border-crimson bg-crimson/15 text-white" : "border-white/10 text-ash hover:border-white/25 hover:text-mist")}>
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {loading || !data ? <LoadingBlock text="Loading orders…" /> : (
        <AdminCard>
          {data.orders.length === 0 ? (
            <p className="py-12 text-center text-[12.5px] text-ash">No orders match this filter.</p>
          ) : (
            <AdminTable
              dense
              head={["Order", "Customer", "Placed", "Payment", "Total", "Status", ""]}
              rows={data.orders.map((o) => [
                <Link key="n" href="#" onClick={(e) => { e.preventDefault(); setDetail(o); }} className="num font-mono text-[11.5px] text-crimson hover:underline">{o.number}</Link>,
                <span key="c"><span className="block text-[12px]">{o.shipName}</span><span className="block text-[10.5px] text-ash">{o.user?.email ?? o.shipCity}</span></span>,
                <span key="d" className="num text-[11px] text-ash">{new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>,
                <span key="p"><Badge tone={o.paymentStatus === "PAID" ? "success" : o.paymentStatus === "REFUNDED" ? "warn" : "neutral"}>{o.paymentStatus}</Badge></span>,
                <span key="t" className="num font-mono text-[12px]">{formatTk(o.total)}</span>,
                <span key="s"><Badge tone={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "crimson" : "outline"}>{o.status.replace(/_/g, " ")}</Badge></span>,
                <span key="a" className="flex justify-end gap-1">
                  {o.status !== "DELIVERED" && o.status !== "CANCELLED" && (
                    <button onClick={() => setOrderStatus(o.id, FLOW[Math.min(FLOW.length - 1, FLOW.indexOf(o.status) + 1)], "Advanced by operations")} className="rounded-sm border border-crimson/40 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-crimson transition-colors hover:bg-crimson/10">Next →</button>
                  )}
                  <button onClick={() => setDetail(o)} aria-label="Open order" className="rounded-sm p-1.5 text-ash transition-colors hover:bg-white/10 hover:text-white"><Eye className="h-3.5 w-3.5" /></button>
                </span>,
              ])}
              keyOf={(i) => data.orders[i]?.id ?? String(i)}
            />
          )}
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
            <p className="text-[11px] text-ash">{data.total} order(s) · page {data.page} of {data.pages}</p>
            <div className="flex gap-2">
              <Button size="md" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</Button>
              <Button size="md" variant="ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next →</Button>
            </div>
          </div>
        </AdminCard>
      )}

      <Modal wide open={Boolean(detail)} onOpenChange={(v) => !v && setDetail(null)} title={detail ? `Order ${detail.number}` : ""}>
        {detail && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="label-tech mb-2">Progress</p>
              <OrderTimeline status={detail.status} events={detail.timeline} />
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.status !== "DELIVERED" && detail.status !== "CANCELLED" && FLOW.slice(FLOW.indexOf(detail.status) + 1, FLOW.indexOf(detail.status) + 2).map((nx) => (
                  <Button key={nx} size="md" onClick={() => setOrderStatus(detail.id, nx, "Advanced by operations")}>Mark {nx.replace(/_/g, " ").toLowerCase()}</Button>
                ))}
                <Button size="md" variant="danger" onClick={() => setOrderStatus(detail.id, "CANCELLED", "Cancelled by operations — stock returned")}>Cancel order</Button>
                {detail.paymentStatus === "PAID" && (
                  <Button size="md" variant="outline" onClick={() => fetch(`/api/admin/orders/${detail.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentStatus: "REFUNDED" }) }).then(() => { reload(); setDetail(null); })}>Refund payment</Button>
                )}
              </div>
            </div>
            <div>
              <p className="label-tech mb-2">Ship to</p>
              <p className="text-[12.5px] leading-relaxed text-mist">{detail.shipName}<br />{detail.shipCity}<br /><span className="text-ash">{detail.user?.email}</span></p>
              <p className="label-tech mb-2 mt-5">Items · {detail.itemCount}</p>
              <ul className="space-y-1.5">
                {(detail.items ?? []).map((it, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px]">
                    <span className="flex-1 truncate">{it.name} <span className="text-ash">×{it.quantity}</span></span>
                    <span className="num font-mono text-mist">{formatTk(it.total)}</span>
                  </li>
                ))}
              </ul>
              <p className="num mt-3 border-t border-white/[0.06] pt-2 text-right font-mono text-[13px]">Total {formatTk(detail.total)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

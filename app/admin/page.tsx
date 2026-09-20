"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { formatTk } from "@/lib/money";
import { AdminCard, Kpi, LoadingBlock, useAdmin } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/bits";

type Analytics = {
  ok: boolean;
  totals: { revenue: number; orders: number; paidOrders: number; customers: number; products: number; aov: number; conversion: number; pendingReviews: number; openMessages: number };
  series: { day: string; revenue: number; orders: number; views: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  lowStock: { sku: string; name: string; label: string; quantity: number }[];
};
type Orders = { ok: boolean; orders: { id: string; number: string; status: string; paymentStatus: string; total: number; createdAt: string; shipName: string; itemCount: number }[] };

const TIP = {
  contentStyle: { background: "#101010", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, fontSize: 12 },
  labelStyle: { color: "#7d7d7d" },
} as const;

export default function AdminDashboardPage() {
  const { data: a, loading } = useAdmin<Analytics>("/api/admin/analytics?range=14");
  const { data: o } = useAdmin<Orders>("/api/admin/orders");

  const chart = useMemo(() => (a?.series ?? []).map((d) => ({ ...d, tk: +(d.revenue / 100).toFixed(0), label: d.day.slice(5) })), [a]);
  const prev = chart.slice(0, 7).reduce((n, d) => n + d.revenue, 0);
  const next = chart.slice(7).reduce((n, d) => n + d.revenue, 0);
  const delta = prev > 0 ? ((next - prev) / prev) * 100 : next > 0 ? 100 : 0;

  if (loading || !a) return <LoadingBlock text="Loading operations dashboard…" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-tech">Control room</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">The store, right now.</h1>
        </div>
        <Link href="/admin/analytics" className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-crimson hover:underline">Full analytics <ArrowUpRight className="h-3 w-3" /></Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue · 14d" value={formatTk(a.totals.revenue)} delta={delta} hint="vs previous 7d" />
        <Kpi label="Paid orders" value={String(a.totals.paidOrders)} hint={`${a.totals.orders} total placed`} />
        <Kpi label="Avg order value" value={formatTk(a.totals.aov)} hint={`${a.totals.conversion}% view→buy`} />
        <Kpi label="Customers" value={String(a.totals.customers)} hint={`${a.totals.products} products live`} />
      </div>

      {(a.totals.pendingReviews > 0 || a.totals.openMessages > 0 || a.lowStock.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-crimson/25 bg-crimson/[0.06] px-4 py-3">
          <ShieldAlert className="h-4 w-4 text-crimson" />
          <p className="text-[12.5px] text-mist">Queue check:</p>
          {a.totals.pendingReviews > 0 && <Link href="/admin/reviews"><Badge tone="warn">{a.totals.pendingReviews} reviews awaiting moderation</Badge></Link>}
          {a.totals.openMessages > 0 && <Link href="/admin/messages"><Badge tone="warn">{a.totals.openMessages} support messages open</Badge></Link>}
          {a.lowStock.length > 0 && <Link href="/admin/products"><Badge tone="crimson">{a.lowStock.length} variants ≤ 5 units</Badge></Link>}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <AdminCard label="Revenue & orders · 14 days">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D71920" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#D71920" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#7d7d7d", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7d7d7d", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TIP} formatter={(v: number, n: string) => (n === "tk" ? formatTk(v * 100) : v)} />
                <Area type="monotone" dataKey="tk" stroke="#D71920" strokeWidth={2} fill="url(#revfill)" animationDuration={900} />
                <Area type="monotone" dataKey="orders" stroke="#FF3138" strokeWidth={1.2} fillOpacity={0} strokeDasharray="4 3" animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard label="Top products by revenue">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.topProducts.map((p) => ({ ...p, tk: +(p.revenue / 100).toFixed(0) }))} layout="vertical" margin={{ left: 8, right: 18 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={108} tick={{ fill: "#a9a9a9", fontSize: 10.5 }} axisLine={false} tickLine={false} />
                <Tooltip {...TIP} cursor={{ fill: "rgba(255,255,255,0.03)" }} formatter={(v: number) => formatTk(v * 100)} />
                <Bar dataKey="tk" radius={[0, 3, 3, 0]} animationDuration={800}>
                  {a.topProducts.map((_, i) => <Cell key={i} fill={i === 0 ? "#D71920" : "#6e1014"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminCard label="Latest orders">
          <ul className="divide-y divide-white/[0.05]">
            {(o?.orders ?? []).slice(0, 6).map((row) => (
              <li key={row.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <Link href="/admin/orders" className="num font-mono text-[11.5px] text-crimson hover:underline">{row.number}</Link>
                <span className="truncate text-[12px] text-ash">{row.shipName}</span>
                <Badge tone="outline">{row.status}</Badge>
                <span className="num ml-auto font-mono text-[12px]">{formatTk(row.total)}</span>
              </li>
            ))}
            {!o?.orders?.length && <li className="py-4 text-center text-[12px] text-ash">No orders yet — place one from the storefront.</li>}
          </ul>
        </AdminCard>
        <AdminCard label="Low stock watchlist">
          <ul className="divide-y divide-white/[0.05]">
            {a.lowStock.slice(0, 6).map((s) => (
              <li key={s.sku} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 text-[12px]">
                <span className="num font-mono text-[10.5px] text-ash">{s.sku}</span>
                <span className="truncate">{s.name} <span className="text-ash">· {s.label}</span></span>
                <span className={cnQty(s.quantity)}>{s.quantity} left</span>
              </li>
            ))}
            {!a.lowStock.length && <li className="py-4 text-center text-[12px] text-ash">Every variant has healthy stock.</li>}
          </ul>
        </AdminCard>
      </div>
    </div>
  );
}

function cnQty(q: number) {
  return `num ml-auto font-mono text-[11px] ${q === 0 ? "text-ember" : "text-ash"}`;
}

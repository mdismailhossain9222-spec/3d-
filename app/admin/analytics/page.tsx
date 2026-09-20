"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Kpi, AdminCard, LoadingBlock, useAdmin } from "@/components/admin/admin-ui";
import { formatTk } from "@/lib/money";

type A = {
  ok: boolean; range: number;
  totals: { revenue: number; orders: number; paidOrders: number; customers: number; products: number; aov: number; conversion: number; pendingReviews: number; openMessages: number };
  series: { day: string; revenue: number; orders: number; views: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  statusDistribution: { name: string; value: number }[];
  lowStock: { sku: string; name: string; label: string; quantity: number }[];
};

const TIP = { contentStyle: { background: "#101010", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, fontSize: 12 }, labelStyle: { color: "#7d7d7d" } } as const;
const STATUS_COLORS = ["#D71920", "#8E1418", "#FF3138", "#b8862b", "#4f8f6b", "#3d6ea5", "#7d7d7d"];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState(30);
  const { data: a, loading } = useAdmin<A>(`/api/admin/analytics?range=${range}`);
  const chart = useMemo(() => (a?.series ?? []).map((d) => ({ ...d, tk: +(d.revenue / 100).toFixed(0), label: range > 45 ? d.day.slice(5) : d.day.slice(8) })), [a, range]);

  if (loading || !a) return <LoadingBlock text="Aggregating…" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label-tech">Intelligence</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Analytics · {a.range} days</h1>
        </div>
        <div className="flex gap-1.5" role="tablist" aria-label="Range">
          {[7, 30, 90].map((r) => (
            <button key={r} role="tab" aria-selected={range === r} onClick={() => setRange(r)} className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${range === r ? "border-crimson bg-crimson/15 text-white" : "border-white/12 text-ash hover:text-mist"}`}>{r}d</button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue" value={formatTk(a.totals.revenue)} hint={`${a.totals.paidOrders} paid orders`} />
        <Kpi label="Placed orders" value={String(a.totals.orders)} hint={`aov ${formatTk(a.totals.aov)}`} />
        <Kpi label="View → buy" value={`${a.totals.conversion}%`} hint="paid orders ÷ page views" />
        <Kpi label="Queue" value={`${a.totals.pendingReviews + a.totals.openMessages}`} hint="reviews + messages open" />
      </div>

      <AdminCard label="Revenue vs traffic">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="rev2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D71920" stopOpacity={0.4} /><stop offset="100%" stopColor="#D71920" stopOpacity={0.02} /></linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#7d7d7d", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="l" tick={{ fill: "#7d7d7d", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill: "#7d7d7d", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TIP} formatter={(v: number, n: string) => (n === "Revenue ৳" ? formatTk(v * 100) : v)} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#7d7d7d" }} />
              <Area yAxisId="l" type="monotone" name="Revenue ৳" dataKey="tk" stroke="#D71920" strokeWidth={2} fill="url(#rev2)" />
              <Line yAxisId="r" type="monotone" name="Page views" dataKey="views" stroke="#7d9fc4" strokeWidth={1.4} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AdminCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <AdminCard label="Order status mix">
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={a.statusDistribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={3} animationDuration={800}>
                  {a.statusDistribution.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} stroke="#070707" />)}
                </Pie>
                <Tooltip {...TIP} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10.5px] text-ash">
            {a.statusDistribution.map((s, i) => <li key={s.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />{s.name.replace(/_/g, " ")} · {s.value}</li>)}
            {!a.statusDistribution.length && <li>no orders in range</li>}
          </ul>
        </AdminCard>

        <AdminCard label="Units by product">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.topProducts} margin={{ left: 4, right: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#7d7d7d", fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-14} textAnchor="end" height={46} />
                <YAxis tick={{ fill: "#7d7d7d", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TIP} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="qty" name="Units" fill="#D71920" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard label="Low stock">
          <ul className="space-y-2">
            {a.lowStock.map((s) => (
              <li key={s.sku} className="flex items-center gap-3 text-[12px]">
                <span className="num font-mono text-[10px] text-ash">{s.sku}</span>
                <span className="min-w-0 flex-1 truncate">{s.name} · {s.label}</span>
                <span className={`num font-mono text-[11px] ${s.quantity === 0 ? "text-ember" : "text-amber-300"}`}>{s.quantity === 0 ? "sold out" : `${s.quantity} left`}</span>
              </li>
            ))}
            {!a.lowStock.length && <li className="py-6 text-center text-[12px] text-ash">All SKUs are above the 5-unit floor.</li>}
          </ul>
        </AdminCard>
      </div>
    </div>
  );
}

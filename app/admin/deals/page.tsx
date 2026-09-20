"use client";

import { useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { AdminCard, AdminTable, LoadingBlock, useAdmin, mutate } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/toast";
import { Countdown } from "@/lib/countdown";
import { formatTk } from "@/lib/money";
import { cn } from "@/lib/utils";

type Deal = {
  id: string; title: string; subtitle: string; type: string; startsAt: string; endsAt: string;
  badge: string | null; products: { id: string; name: string; dealPrice: number | null }[];
};
type List = { ok: boolean; deals: Deal[] };
type Prods = { ok: boolean; products: { id: string; name: string; basePrice: number }[] };

const BLANK = { title: "", subtitle: "", type: "FLASH", badge: "", startsAt: "", endsAt: "", discountPercent: 10, productIds: [] as string[] };

export default function AdminDealsPage() {
  const { data, loading, reload } = useAdmin<List>("/api/admin/deals");
  const { data: prods } = useAdmin<Prods>("/api/admin/products");
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      await mutate("/api/admin/deals", "POST", {
        title: form.title, subtitle: form.subtitle, type: form.type, badge: form.badge || undefined,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : new Date().toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        discountPercent: Number(form.discountPercent), productIds: form.productIds,
      });
      toast.push({ kind: "success", title: "Deal launched", body: "Discounts applied to selected products." });
      setCreating(false); setForm(BLANK); reload();
    } catch (e) { toast.push({ kind: "error", title: "Rejected", body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const end = async (d: Deal) => {
    if (!confirm(`End “${d.title}” and restore original prices?`)) return;
    try { await mutate("/api/admin/deals", "DELETE", { id: d.id }); toast.push({ kind: "success", title: "Deal ended — prices restored" }); reload(); }
    catch (e) { toast.push({ kind: "error", title: "Failed", body: (e as Error).message }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-tech">Merchandising</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Deals</h1>
        </div>
        <Button size="md" onClick={() => setCreating(true)}><Plus className="h-3.5 w-3.5" />Launch deal</Button>
      </div>

      {loading || !data ? <LoadingBlock text="Loading deals…" /> : (
        <AdminCard>
          <AdminTable
            dense
            head={["Deal", "Type", "Covers", "Window", "State", ""]}
            rows={data.deals.map((d) => {
              const now = Date.now();
              const live = new Date(d.startsAt).getTime() <= now && now < new Date(d.endsAt).getTime();
              const upcoming = new Date(d.startsAt).getTime() > now;
              return [
                <span key="t"><span className="flex items-center gap-2 font-display text-[13px] font-semibold"><Tag className="h-3.5 w-3.5 text-crimson" />{d.title}</span><span className="block max-w-[320px] truncate text-[10.5px] text-ash">{d.subtitle}</span></span>,
                <span key="ty" className="num font-mono text-[10.5px] uppercase tracking-widest text-ash">{d.type}</span>,
                <span key="p" className="text-[11.5px] text-mist">{d.products.length ? d.products.map((p) => p.name).join(", ") : "—"}</span>,
                <span key="w" className="text-[11px]">{live ? <span className="flex items-center gap-2 text-mist"><Countdown endsAt={d.endsAt} compact /> left</span> : upcoming ? `opens ${new Date(d.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : <span className="text-ash">closed</span>}</span>,
                <span key="s"><Badge tone={live ? "success" : upcoming ? "outline" : "neutral"}>{live ? "live" : upcoming ? "scheduled" : "ended"}</Badge></span>,
                <span key="a" className="flex justify-end"><button onClick={() => end(d)} aria-label={`End ${d.title}`} className="rounded-sm p-1.5 text-ash transition-colors hover:bg-ember/10 hover:text-ember"><Trash2 className="h-3.5 w-3.5" /></button></span>,
              ];
            })}
            keyOf={(i) => data.deals[i]?.id ?? String(i)}
          />
        </AdminCard>
      )}

      <Modal wide open={creating} onOpenChange={setCreating} title="Launch a deal">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" required>{(id) => <Input id={id} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Crimson Hours" />}</Field>
            <Field label="Type">{(id) => <Select id={id} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>FLASH</option><option>FLAGSHIP</option><option>BUNDLE</option><option>ACCESSORY</option></Select>}</Field>
            <Field label="Subtitle" required className="sm:col-span-2">{(id) => <Input id={id} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="48 hours only — configured flagships at −12%" />}</Field>
            <Field label="Starts">{(id) => <Input id={id} type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />}</Field>
            <Field label="Ends" required>{(id) => <Input id={id} type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />}</Field>
            <Field label="Discount %" required hint="1–70">{(id) => <Input id={id} type="number" min={1} max={70} value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} />}</Field>
            <Field label="Badge" hint="optional chip text">{(id) => <Input id={id} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />}</Field>
          </div>
          <div>
            <p className="label-tech mb-2">Covered products — price-locked at discount, originals remembered</p>
            <div className="grid max-h-44 gap-1 overflow-y-auto rounded-md border border-white/[0.07] p-2 sm:grid-cols-2">
              {(prods?.products ?? []).map((p) => {
                const on = form.productIds.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => setForm({ ...form, productIds: on ? form.productIds.filter((x) => x !== p.id) : [...form.productIds, p.id] })} className={cn("flex items-center justify-between rounded-sm px-2.5 py-1.5 text-left text-[12px] transition-colors", on ? "bg-crimson/15 text-white" : "text-ash hover:bg-white/[0.04] hover:text-mist")}>
                    <span className="truncate">{p.name}</span>
                    <span className="num ml-2 font-mono text-[10px]">{on ? `${formatTk(Math.round((p.basePrice * (100 - form.discountPercent)) / 100) * 100)} ← ${formatTk(p.basePrice)}` : formatTk(p.basePrice)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button loading={busy} disabled={!form.title || !form.subtitle || !form.endsAt || !form.productIds.length} onClick={create}>Launch deal</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

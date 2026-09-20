"use client";

import { useState } from "react";
import { Plus, Ticket, Trash2 } from "lucide-react";
import { AdminCard, AdminTable, LoadingBlock, useAdmin, mutate } from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/bits";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { Toggle } from "@/components/ui/bits";
import { useToast } from "@/components/toast";
import { formatTk } from "@/lib/money";
import { Countdown } from "@/lib/countdown";

type Coupon = {
  id: string; code: string; description: string; type: string; value: number;
  minSubtotal: number | null; maxUses: number | null; usedCount: number;
  startsAt: string | null; endsAt: string | null; isActive: boolean; createdAt: string; perUser: number | null;
};
type List = { ok: boolean; coupons: Coupon[] };

const BLANK = { code: "", description: "", type: "PERCENT", value: 10, minSubtotal: 1000000 as number | "", maxUses: "" as number | "", endsAt: "" };

export default function AdminCouponsPage() {
  const { data, loading, reload } = useAdmin<List>("/api/admin/coupons");
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try { await fn(); toast.push({ kind: "success", title: msg }); reload(); return true; }
    catch (e) { toast.push({ kind: "error", title: "Rejected", body: (e as Error).message }); return false; }
  };

  const create = async () => {
    setBusy(true);
    const ok = await run(() => mutate("/api/admin/coupons", "POST", {
      code: form.code.toUpperCase().trim(), description: form.description, type: form.type,
      value: Number(form.value), minSubtotal: form.minSubtotal === "" ? null : Number(form.minSubtotal),
      maxUses: form.maxUses === "" ? null : Number(form.maxUses),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    }), "Coupon live");
    setBusy(false);
    if (ok) { setCreating(false); setForm(BLANK); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-tech">Incentives</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Coupons</h1>
        </div>
        <Button size="md" onClick={() => setCreating(true)}><Plus className="h-3.5 w-3.5" />New coupon</Button>
      </div>

      {loading || !data ? <LoadingBlock text="Loading coupons…" /> : (
        <AdminCard>
          <AdminTable
            dense
            head={["Code", "Reward", "Constraints", "Usage", "Window", "State", ""]}
            rows={data.coupons.map((c) => {
              const live = c.isActive && (!c.endsAt || new Date(c.endsAt) > new Date()) && (c.maxUses == null || c.usedCount < c.maxUses);
              return [
                <span key="c" className="flex items-center gap-2"><Ticket className="h-3.5 w-3.5 text-crimson" /><span className="num font-mono text-[12px] font-semibold tracking-wider">{c.code}</span></span>,
                <span key="r" className="text-[12px]">{c.type === "PERCENT" ? `${c.value}% off` : c.type === "FIXED" ? `− ${formatTk(c.value)}` : "Free shipping"}<span className="block text-[10.5px] text-ash">{c.description}</span></span>,
                <span key="m" className="text-[11px] text-ash">{c.minSubtotal ? `min ${formatTk(c.minSubtotal)}` : "no minimum"}{c.perUser ? ` · ${c.perUser}/user` : ""}</span>,
                <span key="u" className="num font-mono text-[11px] text-ash">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</span>,
                <span key="w" className="text-[11px]">{c.endsAt ? (live ? <Countdown endsAt={c.endsAt} compact /> : <span className="text-ash">ended</span>) : <span className="text-ash">open-ended</span>}</span>,
                <span key="s"><Badge tone={live ? "success" : c.isActive ? "warn" : "neutral"}>{live ? "live" : c.isActive ? "capped/expired" : "off"}</Badge></span>,
                <span key="a" className="flex items-center justify-end gap-2">
                  <Toggle checked={c.isActive} label={`Toggle ${c.code}`} onChange={(v) => run(() => mutate("/api/admin/coupons", "PATCH", { id: c.id, isActive: v }), v ? "Coupon enabled" : "Coupon disabled")} />
                  <button onClick={() => run(() => mutate("/api/admin/coupons", "DELETE", { id: c.id }), "Coupon deleted")} aria-label={`Delete ${c.code}`} className="rounded-sm p-1.5 text-ash hover:bg-ember/10 hover:text-ember"><Trash2 className="h-3.5 w-3.5" /></button>
                </span>,
              ];
            })}
            keyOf={(i) => data.coupons[i]?.id ?? String(i)}
          />
        </AdminCard>
      )}

      <Modal open={creating} onOpenChange={setCreating} title="New coupon">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Code" required hint="A-Z 0-9">{(id) => <Input id={id} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SPRING15" />}</Field>
            <Field label="Type">{(id) => <Select id={id} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PERCENT">PERCENT — % off</option><option value="FIXED">FIXED — poisha off</option><option value="FREE_SHIPPING">FREE_SHIPPING</option></Select>}</Field>
            <Field label="Description" required className="sm:col-span-2">{(id) => <Input id={id} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="15% spring gesture" />}</Field>
            <Field label="Value" required hint={form.type === "PERCENT" ? "% (1–90)" : "poisha"}>{(id) => <Input id={id} type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />}</Field>
            <Field label="Min subtotal" hint="poisha, optional">{(id) => <Input id={id} type="number" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value === "" ? "" : Number(e.target.value) })} />}</Field>
            <Field label="Max uses" hint="optional">{(id) => <Input id={id} type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value === "" ? "" : Number(e.target.value) })} />}</Field>
            <Field label="Ends at" hint="optional">{(id) => <Input id={id} type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />}</Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button loading={busy} disabled={!/^[A-Z0-9]{3,20}$/.test(form.code) || form.description.length < 3} onClick={create}>Create coupon</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

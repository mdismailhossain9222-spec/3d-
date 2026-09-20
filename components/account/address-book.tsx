"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Pencil, Star, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/bits";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

type Addr = { id: string; fullName: string; phone: string; line1: string; line2: string | null; city: string; postalCode: string; country: string; label: string; isDefault: boolean };
const empty = { fullName: "", phone: "", line1: "", line2: "", city: "", postalCode: "", country: "Bangladesh", label: "HOME" };

export function AddressBook({ initial }: { initial: Addr[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<null | (typeof empty & { id?: string })>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const toast = useToast();

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setErrors({});
    const e: Record<string, string> = {};
    if (editing.fullName.trim().length < 2) e.fullName = "Required";
    if (editing.phone.replace(/\D/g, "").length < 6) e.phone = "Valid phone required";
    if (editing.line1.trim().length < 4) e.line1 = "Required";
    if (editing.city.trim().length < 2) e.city = "Required";
    if (editing.postalCode.trim().length < 3) e.postalCode = "Required";
    if (Object.keys(e).length) { setErrors(e); setBusy(false); return; }
    try {
      const r = await fetch("/api/account/addresses", {
        method: editing.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...(editing.id ? { id: editing.id } : {}), ...editing }),
      });
      const d = await r.json();
      if (d.ok) {
        toast.push({ kind: "success", title: editing.id ? "Address updated" : "Address saved" });
        setEditing(null);
        router.refresh();
        // refetch list
        const rr = await fetch("/api/account/addresses", { cache: "no-store" });
        const dd = await rr.json();
        if (dd.addresses) setRows(dd.addresses);
      } else setErrors(d.fieldErrors ?? { _: d.error });
    } catch { setErrors({ _: "Network error" }); }
    finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    await fetch("/api/account/addresses", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    setRows((cur) => cur.filter((a) => a.id !== id));
    toast.push({ kind: "info", title: "Address removed" });
    router.refresh();
  };

  const makeDefault = async (id: string) => {
    const target = rows.find((r) => r.id === id);
    if (!target) return;
    await fetch("/api/account/addresses", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...target, id, setDefault: true }) }).catch(() => {});
    toast.push({ kind: "success", title: "Default address set" });
    router.refresh();
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Address book</h2>
        <Button size="md" onClick={() => setEditing({ ...empty })}><MapPin className="h-3.5 w-3.5" />Add address</Button>
      </div>

      {rows.length === 0 && (
        <div className="glass-deep rounded-lg p-10 text-center">
          <p className="font-display text-[15px] font-semibold">No saved addresses.</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-ash">Save one and checkout becomes a two-tap affair.</p>
        </div>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {rows.map((a) => (
            <motion.li key={a.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="group glass rounded-lg p-4 transition-colors hover:border-crimson/30">
                <div className="flex items-center gap-2">
                  <Badge tone="outline">{a.label}</Badge>
                  {a.isDefault && <Badge tone="crimson">Default</Badge>}
                  <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <button onClick={() => setEditing({ ...a, line2: a.line2 ?? "" })} aria-label="Edit address" className="rounded-sm p-1.5 text-ash transition-colors hover:bg-white/10 hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => makeDefault(a.id)} aria-label="Set as default" className={cn("rounded-sm p-1.5 transition-colors hover:bg-white/10", a.isDefault ? "text-crimson" : "text-ash hover:text-crimson")}><Star className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(a.id)} aria-label="Delete address" className="rounded-sm p-1.5 text-ash transition-colors hover:bg-ember/10 hover:text-ember"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <p className="mt-3 font-display text-[13.5px] font-semibold">{a.fullName}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-ash">{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city} {a.postalCode}, {a.country}<br />{a.phone}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <Modal open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)} title={editing?.id ? "Edit address" : "New address"}>
        {editing && (
          <div className="space-y-4">
            {errors._ && <p className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">{errors._}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={errors.fullName}>{(id) => <Input id={id} value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />}</Field>
              <Field label="Phone" required error={errors.phone}>{(id) => <Input id={id} value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />}</Field>
              <Field label="Line 1" required error={errors.line1} className="sm:col-span-2">{(id) => <Input id={id} value={editing.line1} onChange={(e) => setEditing({ ...editing, line1: e.target.value })} />}</Field>
              <Field label="Line 2" className="sm:col-span-2">{(id) => <Input id={id} value={editing.line2} onChange={(e) => setEditing({ ...editing, line2: e.target.value })} />}</Field>
              <Field label="City" required error={errors.city}>{(id) => <Input id={id} value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} />}</Field>
              <Field label="Postal code" required error={errors.postalCode}>{(id) => <Input id={id} value={editing.postalCode} onChange={(e) => setEditing({ ...editing, postalCode: e.target.value })} />}</Field>
              <Field label="Country">{(id) => <Input id={id} value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} />}</Field>
              <Field label="Label">{(id) => <Select id={id} value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })}><option>HOME</option><option>WORK</option><option>OTHER</option></Select>}</Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button loading={busy} onClick={save}>{editing.id ? "Save" : "Add address"}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

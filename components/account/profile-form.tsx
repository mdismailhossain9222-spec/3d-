"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/bits";
import { formatTk } from "@/lib/money";

export function ProfileForm({ initial }: { initial: { name: string; email: string; phone: string | null; emailVerified: boolean; createdAt: Date } }) {
  const [values, setValues] = useState({ name: initial.name, phone: initial.phone ?? "" });
  const [busy, setBusy] = useState<"save" | "verify" | null>(null);
  const toast = useToast();
  const router = useRouter();


  const save = async () => {
    setBusy("save");
    try {
      const r = await fetch("/api/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const d = await r.json();
      if (d.ok) { toast.push({ kind: "success", title: "Profile updated" }); router.refresh(); window.dispatchEvent(new CustomEvent("fs:user", { detail: { name: values.name, role: "CUSTOMER" } })); }
      else toast.push({ kind: "error", title: "Save failed", body: d.error });
    } catch { toast.push({ kind: "error", title: "Network error" }); }
    finally { setBusy(null); }
  };

  const requestVerify = async () => {
    setBusy("verify");
    try {
      const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: initial.email }) });
      const d = await r.json();
      toast.push({ kind: "info", title: "Verification mail sent", body: d.resetUrl ? "Open the link from your inbox." : "Check your inbox." });
    } catch { toast.push({ kind: "error", title: "Network error" }); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <section className="glass-deep rounded-lg p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Profile</h2>
        <p className="mt-1 text-[12.5px] text-ash">How we label invoices, courier slips and warranty cards.</p>
        <motion.form layout className="mt-6 grid max-w-xl gap-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <Field label="Full name" required>{(id) => <Input id={id} required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />}</Field>
          <Field label="Phone">{(id) => <Input id={id} value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} placeholder="+8801…" />}</Field>
          <div className="sm:col-span-2">
            <Field label="Email" hint={initial.emailVerified ? "verified" : "unverified"}>
              {(id) => <div className="flex gap-2"><Input id={id} value={initial.email} readOnly className="opacity-70" aria-readonly />{!initial.emailVerified && <Button size="md" variant="outline" type="button" loading={busy === "verify"} onClick={requestVerify}>Send link</Button>}</div>}
            </Field>
          </div>
          <div className="flex items-center justify-between sm:col-span-2">
            <p className="text-[11px] text-ash">Member since {new Date(initial.createdAt).getFullYear()} · <Badge tone="neutral">{formatTk(2500000)}+ tiers</Badge></p>
            <Button type="submit" loading={busy === "save"}>Save changes</Button>
          </div>
        </motion.form>
      </section>
    </div>
  );
}

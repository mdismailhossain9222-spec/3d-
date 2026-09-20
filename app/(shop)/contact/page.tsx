"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { SectionHead, Badge } from "@/components/ui/bits";

export default function ContactPage() {
  const [values, setValues] = useState({ name: "", email: "", subject: "order", body: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const d = await r.json();
      if (d.ok) setSent(true);
      else setErrors(d.fieldErrors ?? { _: d.error });
    } catch { setErrors({ _: "Network error — try again." }); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto w-full max-w-[980px] px-4 pb-24 pt-32 md:px-8">
      <SectionHead kicker="Contact" title="Talk to an engineer, not a bot." sub="Every message lands in the same queue our product team reads before standup." right={<Badge tone="success">Queue empty · avg reply 3h</Badge>} />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass-deep rounded-lg p-6 md:p-8">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center">
              <p className="font-display text-xl font-bold uppercase tracking-tight">Message received.</p>
              <p className="mx-auto mt-2 max-w-sm text-[13px] text-ash">We logged it against {values.email}. Expect a human reply — and a ticket number — within the day.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={() => { setSent(false); setValues({ name: "", email: "", subject: "order", body: "" }); }}>Write another</Button>
                <Link href="/support" className="inline-flex h-10 items-center rounded-sm px-5 text-[12px] text-ash transition-colors hover:text-white">Back to help center</Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              {errors._ && <p className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">{errors._}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required error={errors.name}>{(id) => <Input id={id} required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />}</Field>
                <Field label="Email" required error={errors.email}>{(id) => <Input id={id} type="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />}</Field>
              </div>
              <Field label="Topic">{(id) => (
                <Select id={id} value={values.subject} onChange={(e) => setValues({ ...values, subject: e.target.value })}>
                  <option value="order">Order or delivery</option>
                  <option value="warranty">Warranty & repair</option>
                  <option value="returns">Returns</option>
                  <option value="press">Press & partnerships</option>
                  <option value="other">Something else</option>
                </Select>
              )}</Field>
              <Field label="Message" required error={errors.body} hint={`${values.body.length}/2000`}>
                {(id) => <Textarea id={id} required minLength={10} maxLength={2000} rows={6} value={values.body} onChange={(e) => setValues({ ...values, body: e.target.value })} placeholder="Include your FS- order number if you have one — it saves a round trip." />}
              </Field>
              <Button size="lg" full loading={busy} magnetic type="submit">Send message</Button>
            </form>
          )}
        </div>
        <aside className="space-y-4 text-[13px] leading-relaxed text-ash">
          <div className="glass rounded-lg p-5">
            <p className="label-tech mb-2">Flagship service bar</p>
            <p className="text-mist">FAISTOF Banani — House 42, Road 11</p>
            <p>Dhaka 1213, Bangladesh</p>
            <p className="mt-2">Same-day diagnostics, walk-in 11:00–20:00.</p>
          </div>
          <div className="glass rounded-lg p-5">
            <p className="label-tech mb-2">Escalations</p>
            <p>If a repair crosses 10 working days, we replace the unit — no forms, it&apos;s in the warranty text.</p>
          </div>
          <div className="glass rounded-lg p-5">
            <p className="label-tech mb-2">Press</p>
            <p>Media kits, review units and brand assets: press@faistof.com.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

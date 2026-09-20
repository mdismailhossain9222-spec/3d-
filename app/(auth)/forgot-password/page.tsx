"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ sent?: boolean; resetUrl?: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      setSent(await r.json());
    } finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
      <div className="glass-deep rounded-xl p-8 shadow-lift">
        <p className="label-tech">Recovery</p>
        <h1 className="mt-2 font-display text-[26px] font-bold uppercase tracking-tight">Reset access<span className="text-crimson">.</span></h1>
        <p className="mt-1.5 text-[13px] text-ash">We&apos;ll send a one-hour link. Existing sessions stay signed out.</p>
        {sent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-md border border-white/10 bg-white/[0.03] p-4">
            <p className="flex items-center gap-2 font-display text-[13px] font-semibold"><MailCheck className="h-4 w-4 text-crimson" />Check your inbox</p>
            <p className="mt-1.5 text-[12px] text-ash">If an account exists for {email}, a reset link is on its way.</p>
            {sent.resetUrl && (
              <div className="mt-3 rounded-sm border border-crimson/30 bg-crimson/[0.06] p-2.5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-ash">No mailbox in this sandbox — open directly:</p>
                <Link href={sent.resetUrl} className="mt-1 block font-mono text-[11.5px] text-crimson hover:underline">{sent.resetUrl}</Link>
              </div>
            )}
          </motion.div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="Account email" required>
              {(id) => <Input id={id} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />}
            </Field>
            <Button full size="lg" loading={busy} magnetic type="submit">Send reset link</Button>
          </form>
        )}
        <p className="mt-5 text-center text-[12.5px] text-ash"><Link href="/login" className="text-crimson hover:underline">Back to sign in</Link></p>
      </div>
    </motion.div>
  );
}

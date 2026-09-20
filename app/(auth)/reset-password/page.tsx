"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Field, PasswordInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";

function ResetInner() {
  const sp = useSearchParams();
  const token = sp.get("token") ?? "";
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values.password !== values.confirm) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password: values.password }) });
      const d = await r.json();
      if (d.ok) {
        toast.push({ kind: "success", title: "Password updated", body: "Sign in with your new key." });
        router.push("/login");
      } else setError(d.error ?? "Reset failed.");
    } catch { setError("Network error."); } finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px]">
      <div className="glass-deep rounded-xl p-8 shadow-lift">
        <p className="label-tech">Recovery</p>
        <h1 className="mt-2 font-display text-[26px] font-bold uppercase tracking-tight">New password<span className="text-crimson">.</span></h1>
        {!token && <p className="mt-3 rounded-sm border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[12px] text-amber-300">No token in this link — request a fresh reset.</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && <p className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">{error}</p>}
          <Field label="New password" required hint="8+ chars, letters & numbers">
            {(id) => <PasswordInput id={id} autoComplete="new-password" required minLength={8} value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />}
          </Field>
          <Field label="Confirm password" required>
            {(id) => <PasswordInput id={id} autoComplete="new-password" required value={values.confirm} onChange={(e) => setValues({ ...values, confirm: e.target.value })} />}
          </Field>
          <Button full size="lg" loading={busy} type="submit" disabled={!token}>Update password</Button>
        </form>
        <p className="mt-5 text-center text-[12.5px] text-ash"><Link href="/login" className="text-crimson hover:underline">Back to sign in</Link></p>
      </div>
    </motion.div>
  );
}

export default function ResetPage() {
  return <Suspense fallback={<div className="h-80 w-full max-w-md skeleton rounded-xl" />}><ResetInner /></Suspense>;
}

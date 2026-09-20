"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { useToast } from "@/components/toast";

function strengthOf(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const st = strengthOf(values.password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) { setErrors({ agree: "Please accept the terms to continue." }); return; }
    setBusy(true); setErrors({});
    try {
      const r = await fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const d = await r.json();
      if (d.ok) {
        toast.push({ kind: "success", title: "Account created", body: "You're signed in." });
        window.dispatchEvent(new CustomEvent("fs:login"));
        window.dispatchEvent(new CustomEvent("fs:user", { detail: { name: values.name, role: "CUSTOMER" } }));
        setVerifyUrl(d.verifyUrl ?? null);
        if (!d.verifyUrl) router.push("/account");
      } else {
        setErrors({ ...(d.fieldErrors ?? {}), ...(d.error && !d.fieldErrors ? { _: d.error } : {}) });
      }
    } catch {
      setErrors({ _: "Network error — try again." });
    } finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px]">
      <div className="glass-deep rounded-xl p-7 shadow-lift md:p-8">
        <div className="md:hidden"><Logo /></div>
        <p className="label-tech mt-5 md:mt-0">Membership</p>
        <h1 className="mt-2 font-display text-[26px] font-bold uppercase tracking-tight">Create your account<span className="text-crimson">.</span></h1>

        {verifyUrl ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mt-7">
            <div className="rounded-md border border-crimson/30 bg-crimson/[0.06] p-4">
              <p className="flex items-center gap-2 font-display text-[13px] font-semibold text-white"><Mail className="h-4 w-4 text-crimson" />Verification email simulated</p>
              <p className="mt-2 text-[12px] leading-relaxed text-ash">
                A production deployment sends this link by email. In this environment, delivery is shown here so you can complete the flow:
              </p>
              <a href={verifyUrl} className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-crimson underline-offset-4 hover:underline">{verifyUrl}</a>
            </div>
            <Button full size="lg" className="mt-5" onClick={() => router.push("/account")}>Skip for now — go to account <ArrowRight className="h-4 w-4" /></Button>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
            {errors._ && <p className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">{errors._}</p>}
            <Field label="Full name" required error={errors.name}>
              {(id) => <Input id={id} name="name" autoComplete="name" required value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="Rafi Hasan" />}
            </Field>
            <Field label="Email" required error={errors.email}>
              {(id) => <Input id={id} name="email" type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="you@example.com" />}
            </Field>
            <Field label="Password" required error={errors.password} hint="8+ chars, letters & numbers">
              {(id) => (
                <>
                  <PasswordInput id={id} name="password" autoComplete="new-password" required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} placeholder="Choose something durable" />
                  <div className="mt-2 flex gap-1" aria-hidden>
                    {[0, 1, 2, 3].map((i) => (
                      <motion.span key={i} animate={{ backgroundColor: i < st ? ["#D71920", "#ff3138", "#22c55e", "#22c55e"][st - 1] : "rgba(255,255,255,0.1)" }} className="h-1 flex-1 rounded-full" />
                    ))}
                  </div>
                </>
              )}
            </Field>
            <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-snug text-ash">
              <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setErrors((x) => ({ ...x, agree: "" })); }} className="mt-0.5 h-3.5 w-3.5 accent-[#D71920]" />
              <span>I accept the <Link href="/terms" className="text-crimson hover:underline">terms</Link> and <Link href="/privacy" className="text-crimson hover:underline">privacy policy</Link>.</span>
            </label>
            {errors.agree && <p className="text-[11.5px] text-ember">{errors.agree}</p>}
            <Button full size="lg" loading={busy} magnetic type="submit">Create account <ArrowRight className="h-4 w-4" /></Button>
          </form>
        )}
        <p className="mt-5 border-t border-white/[0.07] pt-4 text-center text-[12.5px] text-ash">
          Already a member? <Link href="/login" className="font-medium text-crimson hover:text-ember">Sign in</Link>
        </p>
      </div>
    </motion.div>
  );
}

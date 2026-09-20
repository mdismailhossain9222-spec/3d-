"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { LogIn, ArrowRight } from "lucide-react";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";
import { useToast } from "@/components/toast";

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const toast = useToast();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErrors({});
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
      const d = await r.json();
      if (d.ok) {
        toast.push({ kind: "success", title: "Signed in", body: `Welcome back, ${d.user.name.split(" ")[0]}.` });
        window.dispatchEvent(new CustomEvent("fs:login"));
        window.dispatchEvent(new CustomEvent("fs:user", { detail: { name: d.user.name, role: d.user.role } }));
        router.push(sp.get("next") ?? (d.user.role === "ADMIN" ? "/admin" : "/account"));
        router.refresh();
      } else {
        setErrors(d.fieldErrors ?? { _: d.error });
        toast.push({ kind: "error", title: "Sign-in failed", body: d.error });
      }
    } catch {
      setErrors({ _: "Network error — try again." });
    } finally { setBusy(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-[420px]">
      <div className="glass-deep rounded-xl p-7 shadow-lift md:p-8">
        <div className="md:hidden"><Logo /></div>
        <p className="label-tech mt-5 md:mt-0">Members</p>
        <h1 className="mt-2 font-display text-[26px] font-bold uppercase tracking-tight">Sign in<span className="text-crimson">.</span></h1>
        <p className="mt-1.5 text-[13px] text-ash">Your carts, wishlists and orders — across devices.</p>

        <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
          {errors._ && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">{errors._}</motion.p>}
          <Field label="Email" required error={errors.email}>
            {(id) => <Input id={id} name="email" type="email" autoComplete="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} placeholder="you@example.com" aria-invalid={Boolean(errors.email)} />}
          </Field>
          <Field label="Password" required error={errors.password}>
            {(id) => <PasswordInput name="password" id={id} autoComplete="current-password" required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} placeholder="••••••••" aria-invalid={Boolean(errors.password)} />}
          </Field>
          <div className="flex items-center justify-between text-[12px]">
            <Link href="/forgot-password" className="text-ash transition-colors hover:text-crimson">Forgot password?</Link>
            <Link href="/verify-email" className="text-ash transition-colors hover:text-crimson">Have a verify link?</Link>
          </div>
          <Button full size="lg" loading={busy} magnetic type="submit">
            Sign in <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <p className="mt-5 border-t border-white/[0.07] pt-4 text-center text-[12.5px] text-ash">
          New to FAISTOF? <Link href="/register" className="font-medium text-crimson transition-colors hover:text-ember">Create an account</Link>
        </p>

        <div className="mt-5 rounded-md border border-white/[0.08] bg-white/[0.03] p-3 font-mono text-[10.5px] leading-relaxed text-ash">
          <p className="mb-1 flex items-center gap-1.5 text-mist"><LogIn className="h-3 w-3 text-crimson" />DEMO CREDENTIALS</p>
          <p>customer: demo@faistof.com / Faistof!Demo1</p>
          <p>admin: admin@faistof.com / Admin!Faistof23</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="h-96 w-full max-w-md skeleton rounded-xl" />}><LoginInner /></Suspense>;
}

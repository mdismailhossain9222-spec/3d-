"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = "working" | "ok" | "error";

function VerifyInner() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const [state, setState] = useState<State>("working");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setMsg("This link has no token. Sign in and request verification again."); return; }
    fetch("/api/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (r) => {
        const d = await r.json();
        setState(d.ok ? "ok" : "error");
        if (!d.ok) setMsg(d.error ?? "Verification failed.");
      })
      .catch(() => { setState("error"); setMsg("Network error — try again."); });
  }, [token]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[420px]">
      <div className="glass-deep rounded-xl p-8 text-center shadow-lift">
        {state === "working" && (
          <>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-crimson" />
            <h1 className="mt-6 font-display text-xl font-bold uppercase tracking-tight">Verifying…</h1>
            <p className="mt-2 text-[13px] text-ash">Cross-checking the token against the vault.</p>
          </>
        )}
        {state === "ok" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="h-7 w-7" />
            </motion.div>
            <h1 className="mt-5 font-display text-xl font-bold uppercase tracking-tight">Email verified</h1>
            <p className="mt-2 text-[13px] leading-relaxed text-ash">Your address is confirmed. Order history, tracking and warranty records are now bound to this inbox.</p>
            <Link href="/account" className="mt-6 inline-flex"><Button size="lg">Open my account</Button></Link>
          </>
        )}
        {state === "error" && (
          <>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ember/15 text-ember"><ShieldAlert className="h-7 w-7" /></div>
            <h1 className="mt-5 font-display text-xl font-bold uppercase tracking-tight">Couldn&apos;t verify</h1>
            <p className="mt-2 text-[13px] text-ash">{msg}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login"><Button variant="outline" size="md">To sign in</Button></Link>
              {token && <Button size="md" onClick={() => window.location.reload()}>Retry</Button>}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-64 w-full max-w-md skeleton rounded-xl" />}>
      <VerifyInner />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, KeyRound, LogOut } from "lucide-react";
import { Field, PasswordInput } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/bits";
import { useToast } from "@/components/toast";

export function SettingsForms({ email, marketing }: { email: string; marketing: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState<null | "pw" | "notify">(null);
  const [opt, setOpt] = useState(marketing);
  const [err, setErr] = useState("");

  const changePassword = async () => {
    setErr("");
    if (pw.newPassword !== pw.confirm) { setErr("New passwords do not match."); return; }
    setBusy("pw");
    try {
      const r = await fetch("/api/account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }) });
      const d = await r.json();
      if (d.ok) { toast.push({ kind: "success", title: "Password changed" }); setPw({ currentPassword: "", newPassword: "", confirm: "" }); }
      else setErr(d.error ?? "Failed.");
    } catch { setErr("Network error."); } finally { setBusy(null); }
  };

  const saveNotify = async (v: boolean) => {
    setBusy("notify");
    setOpt(v);
    try {
      await fetch("/api/account", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketingOptIn: v }) });
      toast.push({ kind: "success", title: "Profile updated" });
    } catch { toast.push({ kind: "error", title: "Couldn't save" }); } finally { setBusy(null); }
  };

  const signOutAll = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.dispatchEvent(new CustomEvent("fs:logout"));
    toast.push({ kind: "info", title: "Signed out everywhere" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="max-w-2xl space-y-5">
      <section className="glass-deep rounded-lg p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight"><KeyRound className="h-4 w-4 text-crimson" />Password</h2>
        {err && <p className="mt-3 rounded-sm border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">{err}</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Field label="Current" required>{(id) => <PasswordInput id={id} autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />}</Field>
          <Field label="New" required>{(id) => <PasswordInput id={id} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />}</Field>
          <Field label="Confirm" required>{(id) => <PasswordInput id={id} autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />}</Field>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={changePassword} loading={busy === "pw"} disabled={!pw.currentPassword || !pw.newPassword}>Change password</Button></div>
      </section>

      <section className="glass-deep rounded-lg p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-tight"><Bell className="h-4 w-4 text-crimson" />Notifications</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-[13.5px] font-medium">Launch briefings</p><p className="text-[11.5px] text-ash">Drops, deal windows and firmware notes to {email}.</p></div>
            <Toggle checked={opt} onChange={saveNotify} label="Marketing emails" />
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
            <div><p className="text-[13.5px] font-medium">Order updates</p><p className="text-[11.5px] text-ash">Tracking events, delivery and payment receipts.</p></div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10.5px] text-emerald-300">Always on</span>
          </div>
        </div>
      </section>

      <section className="glass-deep rounded-lg p-6">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Sessions</h2>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[12.5px] text-ash">Sign out of this browser and clear the session token.</p>
          <Button variant="danger" onClick={signOutAll}><LogOut className="h-3.5 w-3.5" />Sign out</Button>
        </div>
      </section>
    </div>
  );
}

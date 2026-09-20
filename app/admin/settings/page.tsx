"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { LoadingBlock, mutate, useAdmin } from "@/components/admin/admin-ui";
import { Field, Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";
import { formatTk } from "@/lib/money";

type Settings = { ok: boolean; settings: Record<string, string> };
const NUM = (v: string | undefined, fallback: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : fallback);

const FIELDS: { key: string; label: string; hint: string; poisha?: boolean; step?: string }[] = [
  { key: "taxRate", label: "Tax rate %", hint: "applied to discounted subtotal" },
  { key: "shippingStandard", label: "Standard shipping", hint: "poisha (1 ৳ = 100)", poisha: true },
  { key: "shippingExpress", label: "Express shipping", hint: "poisha", poisha: true },
  { key: "freeShippingAbove", label: "Free shipping above", hint: "poisha", poisha: true },
];

export default function AdminSettingsPage() {
  const { data, loading } = useAdmin<Settings>("/api/admin/settings");
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.settings) setValues({
      taxRate: String(NUM(data.settings.taxRate, 5)),
      shippingStandard: String(NUM(data.settings.shippingStandard, 29900)),
      shippingExpress: String(NUM(data.settings.shippingExpress, 150000)),
      freeShippingAbove: String(NUM(data.settings.freeShippingAbove, 5000000)),
      storeName: data.settings.storeName ?? "FAISTOF",
      supportEmail: data.settings.supportEmail ?? "care@faistof.com",
      heroMode: data.settings.heroMode ?? "cinematic",
    });
  }, [data]);

  const save = async () => {
    setBusy(true);
    try {
      await mutate("/api/admin/settings", "PATCH", {
        taxRate: values.taxRate, shippingStandard: values.shippingStandard, shippingExpress: values.shippingExpress,
        freeShippingAbove: values.freeShippingAbove, storeName: values.storeName, supportEmail: values.supportEmail, heroMode: values.heroMode,
      });
      toast.push({ kind: "success", title: "Store settings saved", body: "Checkout and pricing pick this up on the next request." });
    } catch (e) { toast.push({ kind: "error", title: "Failed", body: (e as Error).message }); }
    finally { setBusy(false); }
  };

  if (loading || !data) return <LoadingBlock text="Loading store settings…" />;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <p className="label-tech">Commerce engine</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Store settings</h1>
        <p className="mt-1 text-[12.5px] text-ash">These values feed the live checkout math — change them and the store follows.</p>
      </div>
      <div className="glass-deep rounded-lg p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <Field key={f.key} label={f.label} hint={f.hint}>
              {(id) => (
                <div className="space-y-1">
                  <Input id={id} type="number" step={f.step ?? "1"} min={0} value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
                  {f.poisha && <p className="num text-[10.5px] text-ash">= {formatTk(Number(values[f.key] || 0))}</p>}
                </div>
              )}
            </Field>
          ))}
          <Field label="Store name">{(id) => <Input id={id} value={values.storeName ?? ""} onChange={(e) => setValues({ ...values, storeName: e.target.value })} />}</Field>
          <Field label="Support email">{(id) => <Input id={id} type="email" value={values.supportEmail ?? ""} onChange={(e) => setValues({ ...values, supportEmail: e.target.value })} />}</Field>
          <Field label="Hero behaviour" className="sm:col-span-2" hint="cinematic = full scroll sequence; static = poster fallback for weak devices">
            {(id) => (
              <Select id={id} value={values.heroMode ?? "cinematic"} onChange={(e) => setValues({ ...values, heroMode: e.target.value })}>
                <option value="cinematic">Cinematic scroll film</option>
                <option value="static">Static poster</option>
              </Select>
            )}
          </Field>
        </div>
        <div className="mt-6 flex justify-end">
          <Button loading={busy} onClick={save}><Save className="h-3.5 w-3.5" />Save settings</Button>
        </div>
      </div>
    </div>
  );
}

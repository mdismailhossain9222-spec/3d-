"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, ChevronLeft, ChevronRight, CreditCard, Lock, MapPin, PackageCheck, ShieldCheck, Truck,
} from "lucide-react";
import { useCart } from "@/lib/store";
import { formatTk } from "@/lib/money";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/bits";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/lib/hooks";

type AddressT = { id?: string; fullName: string; phone: string; line1: string; line2?: string; city: string; postalCode: string; country: string };
type CouponT = { code: string; discount: number; freeShipping: boolean } | null;
const STEPS = ["Cart", "Shipping", "Delivery", "Payment", "Review", "Done"] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [ship, setShip] = useState<AddressT & { email: string }>({ fullName: "", email: "", phone: "", line1: "", line2: "", city: "", postalCode: "", country: "Bangladesh" });
  const [shipErrors, setShipErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<AddressT[]>([]);
  const [delivery, setDelivery] = useState<"STANDARD" | "EXPRESS" | "PICKUP">("STANDARD");
  const [giftNote, setGiftNote] = useState("");
  const [coupon, setCoupon] = useState<CouponT>(null);
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvc: "" });
  const [payState, setPayState] = useState<"idle" | "creating" | "confirming" | "failed">("idle");
  const [payError, setPayError] = useState("");
  type Snapshot = { number: string; id: string; items: number; subtotal: number; discount: number; shipping: number; tax: number; total: number };
  const [done, setDone] = useState<Snapshot | null>(null);
  const [terms, setTerms] = useState(false);
  const [saveAddr, setSaveAddr] = useState(true);

  useEffect(() => {
    fetch("/api/account/addresses", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.addresses?.length) {
          setSaved(d.addresses);
          const a = d.addresses[0];
          setShip((s) => ({ ...s, fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, postalCode: a.postalCode, country: a.country }));
        }
      }).catch(() => {});
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setShip((s) => ({ ...s, email: d.user.email, fullName: s.fullName || d.user.name })); })
      .catch(() => {});
  }, []);

  const subtotal = cart.subtotal;
  const freeShip = subtotal >= 5000000;
  const shipCost = delivery === "PICKUP" ? 0 : coupon?.freeShipping ? 0 : delivery === "EXPRESS" ? 150000 : freeShip ? 0 : 29900;
  const discount = coupon?.discount ?? 0;
  const tax = Math.round(Math.max(0, subtotal - discount) * 0.05);
  const total = Math.max(0, subtotal - discount + shipCost + tax);
  const { ref: sumRef, val: sumVal } = useCountUp<HTMLDivElement>(total, 500);

  const applyCoupon = async () => {
    const code = prompt("Coupon code:");
    if (!code) return;
    const r = await fetch("/api/coupons/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, subtotal }) });
    const d = await r.json();
    if (d.valid) { setCoupon({ code: d.code, discount: d.discount, freeShipping: d.freeShipping }); toast.push({ kind: "success", title: "Coupon applied", body: d.description }); }
    else { setCoupon(null); toast.push({ kind: "error", title: "Invalid coupon", body: d.reason ?? "Not applicable to this cart." }); }
  };

  const validateShip = () => {
    const e: Record<string, string> = {};
    if (ship.fullName.trim().length < 2) e.fullName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ship.email)) e.email = "Valid email required";
    if (ship.phone.replace(/\D/g, "").length < 6) e.phone = "Valid phone required";
    if (ship.line1.trim().length < 4) e.line1 = "Street address required";
    if (ship.city.trim().length < 2) e.city = "City required";
    if (ship.postalCode.trim().length < 3) e.postalCode = "Postal code required";
    setShipErrors(e);
    return Object.keys(e).length === 0;
  };

  const go = (n: number) => {
    if (n === 2 && !validateShip()) return;
    if (n > step && payState !== "idle" && payState !== "failed") return;
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    if (!terms) { toast.push({ kind: "warning", title: "One more thing", body: "Accept the terms to complete the order." }); return; }
    try {
      setPayState("creating"); setPayError("");
      const items = cart.items.map((l) => ({ variantId: l.variantId, quantity: l.qty }));
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items, coupon: coupon?.code, delivery, giftNote,
          shipping: { ...ship, line2: ship.line2 || undefined },
          payment: { method: "CARD", number: card.number, name: card.name, exp: card.exp, cvc: card.cvc },
        }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error ?? "Checkout failed.");
      setPayState("confirming");
      const conf = await fetch("/api/checkout/confirm", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId: d.orderId, intentId: d.intentId, cardNumber: card.number }),
      });
      const cd = await conf.json();
      if (!cd.ok) {
        setPayState("failed");
        setPayError(cd.error ?? "Payment was declined.");
        toast.push({ kind: "error", title: "Payment declined", body: cd.error });
        return;
      }
      // provider authorized — clear local cart, finish
      cart.clear();
      if (saveAddr && !ship.id) {
        fetch("/api/account/addresses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(ship) }).catch(() => {});
      }
      setDone({ number: d.orderNumber, id: d.orderId, items: cart.count, subtotal, discount, shipping: shipCost, tax, total });
      setPayState("idle");
      setStep(5);
      toast.push({ kind: "success", title: "Order confirmed", body: `${d.orderNumber} — tracking is live.` });
    } catch (e) {
      setPayState("failed");
      setPayError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const formatted = useMemo(() => card.number.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(), [card.number]);

  if (cart.items.length === 0 && step !== 5 && !done) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 pb-24 pt-36">
        <EmptyState illustration="cart" title="Nothing to check out yet." body="Your cart is empty — fill it with something worth configuring." cta={<div className="flex gap-3"><ButtonLink href="/shop">Start shopping</ButtonLink><ButtonLink href="/deals" variant="outline">See deals</ButtonLink></div>} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 pb-28 pt-28 md:px-8">
      {/* step rail */}
      <nav aria-label="Checkout progress" className="mb-10 flex items-center justify-between gap-1">
        {STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "todo";
          return (
            <div key={s} className="flex flex-1 items-center gap-1">
              <button
                disabled={i >= step || step === 5}
                onClick={() => i < step && setStep(i)}
                className={cn("group flex items-center gap-2", i < step && "cursor-pointer")}
              >
                <span className={cn(
                  "grid h-7 w-7 place-items-center rounded-full border font-mono text-[10px] transition-all duration-300",
                  state === "done" && "border-crimson bg-crimson text-white",
                  state === "active" && "scale-110 border-crimson text-crimson shadow-crim",
                  state === "todo" && "border-white/15 text-ash"
                )}>
                  {state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn("hidden font-display text-[10.5px] font-semibold uppercase tracking-[0.14em] sm:block", state === "todo" ? "text-ash" : "text-white")}>{s}</span>
              </button>
              {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < step ? "bg-crimson/60" : "bg-white/10")} />}
            </div>
          );
        })}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <AnimatePresence mode="wait">
            {/* STEP 0 — CART */}
            {step === 0 && (
              <motion.section key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                <h2 className="mb-5 font-display text-xl font-bold uppercase tracking-tight">Review your cart</h2>
                <ul className="overflow-hidden rounded-lg border border-white/[0.07]">
                  {cart.items.map((l, i) => (
                    <li key={l.variantId} className={cn("flex items-center gap-4 bg-abyss/40 px-4 py-3.5", i % 2 && "bg-transparent")}>
                      <img src={l.image} alt="" className="h-14 w-12 object-contain" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[13px] font-semibold">{l.name}</p>
                        <p className="truncate font-mono text-[10.5px] text-ash">{l.label} · ×{l.qty}</p>
                      </div>
                      <p className="num font-mono text-[12.5px]">{formatTk(l.price * l.qty)}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between rounded-md border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <p className="text-[12.5px] text-ash">{coupon ? <>Coupon <span className="text-emerald-400">{coupon.code}</span> active</> : "Have a coupon?"}</p>
                  <button onClick={applyCoupon} className={cn("rounded-sm px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-widest transition-all active:scale-95", coupon ? "border border-white/15 text-ash hover:text-white" : "border border-crimson/50 text-crimson hover:bg-crimson/10")}>
                    {coupon ? "Change" : "Apply"}
                  </button>
                </div>
              </motion.section>
            )}

            {/* STEP 1 — SHIPPING */}
            {step === 1 && (
              <motion.section key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold uppercase tracking-tight">Shipping address</h2>
                  <span className="label-tech flex items-center gap-1.5"><MapPin className="h-3 w-3 text-crimson" />{saved.length} saved</span>
                </div>
                {saved.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {saved.map((a) => (
                      <button key={a.fullName + a.line1} onClick={() => setShip({ ...ship, ...a })} className="shrink-0 rounded-md border border-white/10 bg-abyss/60 px-3 py-2 text-left text-[11px] text-mist transition-all hover:border-crimson/50">
                        <span className="block font-semibold text-white">{a.fullName}</span>
                        <span className="block text-ash">{a.line1}, {a.city}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" required error={shipErrors.fullName}>{(id) => <Input id={id} name="fullName" required value={ship.fullName} onChange={(e) => setShip({ ...ship, fullName: e.target.value })} />}</Field>
                  <Field label="Email" required error={shipErrors.email}>{(id) => <Input id={id} type="email" name="email" required value={ship.email} onChange={(e) => setShip({ ...ship, email: e.target.value })} />}</Field>
                  <Field label="Phone" required error={shipErrors.phone}>{(id) => <Input id={id} name="phone" required value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} placeholder="+8801…" />}</Field>
                  <Field label="Country">{(id) => <Input id={id} name="country" value={ship.country} onChange={(e) => setShip({ ...ship, country: e.target.value })} />}</Field>
                  <Field label="Address line 1" required error={shipErrors.line1} className="sm:col-span-2">{(id) => <Input id={id} name="line1" required value={ship.line1} onChange={(e) => setShip({ ...ship, line1: e.target.value })} placeholder="House, road, area" />}</Field>
                  <Field label="Address line 2" className="sm:col-span-2">{(id) => <Input id={id} name="line2" value={ship.line2 ?? ""} onChange={(e) => setShip({ ...ship, line2: e.target.value })} placeholder="Flat, building (optional)" />}</Field>
                  <Field label="City" required error={shipErrors.city}>{(id) => <Input id={id} name="city" required value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} />}</Field>
                  <Field label="Postal code" required error={shipErrors.postalCode}>{(id) => <Input id={id} name="postalCode" required value={ship.postalCode} onChange={(e) => setShip({ ...ship, postalCode: e.target.value })} />}</Field>
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] text-ash"><input type="checkbox" className="h-3.5 w-3.5 accent-[#D71920]" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} />Save this address to my account</label>
              </motion.section>
            )}

            {/* STEP 2 — DELIVERY */}
            {step === 2 && (
              <motion.section key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-5">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">Delivery method</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {([
                    { key: "STANDARD", t: "Standard", d: "2–4 business days", c: freeShip ? "FREE" : formatTk(29900), icon: <Truck className="h-4 w-4" /> },
                    { key: "EXPRESS", t: "Express", d: "Next business day", c: formatTk(150000), icon: <PackageCheck className="h-4 w-4" /> },
                    { key: "PICKUP", t: "Store pickup", d: "Banani flagship, 10–20h", c: "FREE", icon: <MapPin className="h-4 w-4" /> },
                  ] as const).map((o) => (
                    <button key={o.key} onClick={() => setDelivery(o.key)} className={cn("rounded-lg border p-4 text-left transition-all active:scale-[0.98]", delivery === o.key ? "border-crimson/60 bg-crimson/[0.07] shadow-crim" : "border-white/10 hover:border-white/30")}>
                      <span className="flex items-center justify-between text-crimson">{o.icon}<span className="num font-mono text-[10.5px] text-mist">{o.c}</span></span>
                      <p className="mt-3 font-display text-[13.5px] font-bold uppercase tracking-wide">{o.t}</p>
                      <p className="mt-0.5 text-[11.5px] text-ash">{o.d}</p>
                    </button>
                  ))}
                </div>
                <Field label="Gift note (optional)">{(id) => <Textarea id={id} maxLength={160} value={giftNote} onChange={(e) => setGiftNote(e.target.value)} placeholder="Engraved on the packing slip." />}</Field>
                <p className="text-[11.5px] text-ash">Deliveries are fully insured and signature-required across 64 districts.</p>
              </motion.section>
            )}

            {/* STEP 3 — PAYMENT */}
            {step === 3 && (
              <motion.section key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-5">
                <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-tight"><CreditCard className="h-4 w-4 text-crimson" />Payment</h2>
                <div className="rounded-lg border border-white/[0.08] bg-gradient-to-b from-iron/60 to-abyss p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="label-tech">FAISTOF sandbox gateway</span>
                    <span className="flex gap-1">{["VISA", "MC"].map((b) => <span key={b} className="rounded-[3px] border border-white/15 px-1.5 py-0.5 font-mono text-[8px] text-ash">{b}</span>)}</span>
                  </div>
                  <div className="space-y-4">
                    <Field label="Card number" required>
                      {(id) => <Input id={id} inputMode="numeric" autoComplete="cc-number" name="cardNumber" required value={formatted} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, "").slice(0, 16) })} placeholder="4242 4242 4242 4242" className="font-mono tracking-[0.18em]" />}
                    </Field>
                    <Field label="Name on card" required>{(id) => <Input id={id} required value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder={ship.fullName} name="cardName" />}</Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Expiry" required>{(id) => <Input id={id} name="cardExp" required value={card.exp} onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 4); setCard({ ...card, exp: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v }); }} placeholder="MM/YY" className="font-mono" />}</Field>
                      <Field label="CVC" required>{(id) => <Input id={id} name="cardCvc" required inputMode="numeric" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="•••" className="font-mono" />}</Field>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-crimson/25 bg-crimson/[0.05] p-4 text-[12px] leading-relaxed text-ash">
                  <p className="mb-1.5 font-semibold text-mist">Sandbox behaviour — identical contract to a live PSP:</p>
                  <p><span className="num font-mono text-mist">4242 4242 4242 4242</span> → approval · <span className="num font-mono text-mist">4000 0000 0000 0002</span> → decline. Nothing is charged; intents are simulated server-side. Swap <span className="font-mono text-[10.5px]">PAYMENT_PROVIDER=stripe</span> for production keys.</p>
                </div>
                {payState === "failed" && <p className="rounded-sm border border-ember/40 bg-ember/10 px-3 py-2 text-[12px] text-ember">{payError}</p>}
              </motion.section>
            )}

            {/* STEP 4 — REVIEW */}
            {step === 4 && (
              <motion.section key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-5">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">Confirm & pay</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-white/[0.07] p-4">
                    <p className="label-tech mb-2">Ship to</p>
                    <p className="text-[13px] font-medium">{ship.fullName}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ash">{ship.line1}{ship.line2 ? `, ${ship.line2}` : ""}<br />{ship.city} {ship.postalCode}, {ship.country}<br />{ship.phone} · {ship.email}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.07] p-4">
                    <p className="label-tech mb-2">Method</p>
                    <p className="text-[13px] font-medium">{delivery === "PICKUP" ? "Store pickup · Banani" : delivery === "EXPRESS" ? "Express — next day" : "Standard — 2–4 days"}</p>
                    <p className="mt-1 text-[12px] text-ash">Card ending {card.number.slice(-4) || "••••"} · {card.exp || "MM/YY"}</p>
                    {giftNote && <p className="mt-2 rounded-sm bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] italic text-mist">“{giftNote}”</p>}
                  </div>
                </div>
                <ul className="overflow-hidden rounded-lg border border-white/[0.07]">
                  {cart.items.map((l, i) => (
                    <li key={l.variantId} className={cn("flex items-center gap-3 px-4 py-3 text-[12.5px]", i % 2 ? "bg-white/[0.02]" : "bg-transparent")}>
                      <img src={l.image} alt="" className="h-10 w-8 object-contain" />
                      <span className="flex-1 truncate">{l.name} <span className="text-ash">×{l.qty}</span></span>
                      <span className="num font-mono">{formatTk(l.price * l.qty)}</span>
                    </li>
                  ))}
                </ul>
                <label className={cn("flex cursor-pointer items-start gap-2.5 rounded-md border p-3.5 text-[12px] leading-snug transition-colors", terms ? "border-crimson/40 bg-crimson/[0.05]" : "border-ember/40 bg-ember/[0.06]")}>
                  <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-[#D71920]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                  <span className={terms ? "text-mist" : "text-ember"}>I authorize FAISTOF to charge {formatTk(total)} and I accept the <Link href="/terms" className="underline underline-offset-2">sales terms</Link> & 14-day return policy.</span>
                </label>
                <Button size="xl" full loading={payState === "creating" || payState === "confirming"} onClick={placeOrder} className="gap-2">
                  <Lock className="h-4 w-4" />
                  {payState === "creating" ? "Creating secure order…" : payState === "confirming" ? "Awaiting provider…" : payState === "failed" ? "Retry payment" : `Pay ${formatTk(total)}`}
                </Button>
                <p className="flex items-center justify-center gap-2 text-[10.5px] text-ash"><ShieldCheck className="h-3 w-3 text-emerald-400" />Prices & stock re-validated server-side · payment decided by the provider only</p>
              </motion.section>
            )}

            {/* STEP 5 — DONE */}
            {step === 5 && done && (
              <motion.section key="s5" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-crimson/40 bg-crimson/10 text-crimson shadow-crim">
                  <Check className="h-10 w-10" strokeWidth={2.5} />
                </motion.div>
                <h2 className="mt-6 font-display text-2xl font-bold uppercase tracking-tight">Order confirmed<span className="text-crimson">.</span></h2>
                <p className="num mt-2 font-mono text-[13px] text-ash">Reference <span className="text-white">{done.number}</span></p>
                <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-ash">The provider authorized {formatTk(total)}. A confirmation goes to {ship.email}. You can watch every leg of the journey from your account.</p>
                <div className="mt-7 flex justify-center gap-3">
                  <ButtonLink href={`/account/orders/${done.id}`}>Track this order <ChevronRight className="h-4 w-4" /></ButtonLink>
                  <ButtonLink href="/shop" variant="outline">Continue shopping</ButtonLink>
                </div>
                <div className="mx-auto mt-10 max-w-md rounded-lg border border-white/[0.07] p-4 text-left">
                  {["Order placed", "Confirmed by payment", "Processing at DHK-01", "Handed to courier"].map((t, i) => (
                    <p key={t} className="flex items-center gap-3 py-1.5 text-[12px]">
                      <span className={cn("grid h-5 w-5 place-items-center rounded-full border", i < 2 ? "border-crimson bg-crimson text-white" : "border-white/15 text-ash")}>{i < 2 ? <Check className="h-3 w-3" /> : i + 2}</span>
                      <span className={i < 2 ? "text-mist" : "text-ash"}>{t}</span>
                      {i === 2 && <span className="ml-auto font-mono text-[10px] text-crimson animate-pulse">in progress…</span>}
                    </p>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* nav */}
          {step < 5 && (
            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <button onClick={() => go(step - 1)} className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ash transition-colors hover:text-white">
                  <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />Back
                </button>
              ) : <Link href="/cart" className="font-mono text-[11px] uppercase tracking-[0.18em] text-ash transition-colors hover:text-white">Edit cart</Link>}
              {step < 4 && <Button size="lg" onClick={() => go(step + 1)}>Continue<ChevronRight className="h-4 w-4" /></Button>}
            </div>
          )}
        </div>

        {/* live summary */}
        <aside className="glass-deep h-fit rounded-lg p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.18em]">{step === 5 && done ? "Receipt" : "Summary"}</h2>
          {step === 5 && done ? (
            <>
              <dl className="mt-4 space-y-2 text-[12.5px]">
                <div className="flex justify-between"><dt className="text-ash">Items ({done.items})</dt><dd className="num font-mono">{formatTk(done.subtotal)}</dd></div>
                {done.discount > 0 && <div className="flex justify-between text-emerald-400"><dt>Coupon</dt><dd className="num font-mono">− {formatTk(done.discount)}</dd></div>}
                <div className="flex justify-between"><dt className="text-ash">Shipping</dt><dd className="num font-mono">{done.shipping ? formatTk(done.shipping) : "FREE"}</dd></div>
                <div className="flex justify-between"><dt className="text-ash">Tax</dt><dd className="num font-mono">{formatTk(done.tax)}</dd></div>
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-white/[0.08] pt-4">
                <span className="font-display text-[12px] font-bold uppercase tracking-[0.16em]">Paid</span>
                <span className="num font-mono text-xl font-bold text-crimson">{formatTk(done.total)}</span>
              </div>
            </>
          ) : (
            <>
              <dl className="mt-4 space-y-2 text-[12.5px]">
                <div className="flex justify-between"><dt className="text-ash">Items ({cart.count})</dt><dd className="num font-mono">{formatTk(subtotal)}</dd></div>
                {discount > 0 && <div className="flex justify-between text-emerald-400"><dt>Coupon</dt><dd className="num font-mono">− {formatTk(discount)}</dd></div>}
                <div className="flex justify-between"><dt className="text-ash">Shipping</dt><dd className="num font-mono">{shipCost ? formatTk(shipCost) : "FREE"}</dd></div>
                <div className="flex justify-between"><dt className="text-ash">Tax</dt><dd className="num font-mono">{formatTk(tax)}</dd></div>
              </dl>
              <div ref={sumRef} className="mt-4 flex items-baseline justify-between border-t border-white/[0.08] pt-4">
                <span className="font-display text-[12px] font-bold uppercase tracking-[0.16em]">Total</span>
                <span className="num font-mono text-xl font-bold text-crimson">{formatTk(Math.round(sumVal))}</span>
              </div>
            </>
          )}
          <ul className="mt-5 space-y-2.5 text-[11.5px] text-ash">
            <li className="flex gap-2"><ShieldCheck className="h-3.5 w-3.5 shrink-0 text-crimson" />2-year warranty & 14-day returns</li>
            <li className="flex gap-2"><Truck className="h-3.5 w-3.5 shrink-0 text-crimson" />Insured delivery, signature on hand-over</li>
            <li className="flex gap-2"><Lock className="h-3.5 w-3.5 shrink-0 text-crimson" />3D-secure style confirmation via provider</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Phone, MessageSquare, BookOpen, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { SectionHead, Reveal } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/bits";
import { Faq } from "@/components/support/faq";

export const metadata: Metadata = { title: "Support", description: "FAISTOF help center — shipping, returns, warranty and live humans." };

const FAQS = [
  { q: "When does my configured phone ship?", a: "Configured devices are assembled and QC'd at DHK-01 within 24 hours of payment confirmation. Standard courier adds 2–4 days; express leaves the same evening for next-day handover inside Dhaka and Chattogram." },
  { q: "How does the 2-year warranty work?", a: "It's on the device, not on you. Bring the invoice number to any FAISTOF service bar or ship it to us insured. Board, display and battery defects are covered; we also cover accidental damage on Ultra if you kept the Crimson Care add-on." },
  { q: "Can I return an opened phone?", a: "Yes — 14 days, opened and used, as long as it isn't physically damaged. Refunds settle back to the original payment method within 3 business days of the unit passing incoming QC." },
  { q: "Do accessories share the same warranty?", a: "WATCH and BUDS carry 1 year; CHARGE, POWER and CASE carry 6 months. Batteries in all products are covered to 80% capacity for the warranty term." },
  { q: "Is my data erased when I send a device in?", a: "Service-mode never mounts your storage. Before any board swap you're prompted for an on-device confirmation, and every returned unit ships with an attestation log." },
  { q: "Which chargers are safe for HyperCharge?", a: "Anything that speaks our PD/PPS profile — FAISTOF CHARGE is the reference. Other 100W+ PD3 chargers negotiate down safely; no-name bricks don't get thermal handshake and stay at 18W." },
];

const CARDS = [
  { href: "/contact", t: "Message us", d: "Reply within 4h on weekdays.", icon: <MessageSquare className="h-4 w-4" /> },
  { href: "/shipping", t: "Shipping & delivery", d: "Timelines, coverage, insurance.", icon: <Truck className="h-4 w-4" /> },
  { href: "/returns", t: "Returns", d: "14 days, opened is fine.", icon: <RotateCcw className="h-4 w-4" /> },
  { href: "/warranty", t: "Warranty", d: "2 years on every phone.", icon: <ShieldCheck className="h-4 w-4" /> },
];

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 pb-24 pt-32 md:px-8">
      <SectionHead kicker="Help center" title="We answer on the first try." sub="Engineers answer, not scripts. Most threads close inside 4 working hours." right={<Badge tone="success">Queue empty · avg reply 3h</Badge>} />

      <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c, i) => (
          <Reveal key={c.href} delay={i * 90}>
            <Link href={c.href} className="group flex h-full flex-col rounded-lg border border-white/[0.07] bg-abyss/50 p-5 transition-all hover:-translate-y-1 hover:border-crimson/40">
              <span className="text-crimson">{c.icon}</span>
              <p className="mt-3 font-display text-[14px] font-semibold">{c.t}</p>
              <p className="mt-1 text-[12px] text-ash">{c.d}</p>
              <span className="mt-auto pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ash transition-colors group-hover:text-crimson">Open →</span>
            </Link>
          </Reveal>
        ))}
      </div>

      <section className="mt-14 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-tight">Frequent questions</h2>
          <Faq items={FAQS} />
        </div>
        <aside className="space-y-3">
          <div className="glass-deep rounded-lg p-5">
            <p className="label-tech mb-2">Direct lines</p>
            <p className="flex items-center gap-2 text-[13px]"><Phone className="h-3.5 w-3.5 text-crimson" />+880 9610 000 111</p>
            <p className="mt-1.5 flex items-center gap-2 text-[13px]"><MessageSquare className="h-3.5 w-3.5 text-crimson" />care@faistof.com</p>
            <p className="mt-3 text-[11px] leading-relaxed text-ash">Sun–Thu · 09:00–21:00 BST. Friday service bar opens 15:00.</p>
            <ButtonLink href="/contact" full size="md" className="mt-4">Start a conversation</ButtonLink>
          </div>
          <div className="glass-deep rounded-lg p-5">
            <p className="label-tech mb-2">Guides</p>
            {[["FaistOS 2.0 field guide", "#"], ["Caring for etched glass", "#"]].map(([t]) => (
              <p key={t} className="flex items-center gap-2 py-1 text-[12.5px] text-mist"><BookOpen className="h-3.5 w-3.5 text-crimson" />{t}</p>
            ))}
            <p className="mt-2 text-[10.5px] leading-relaxed text-ash">Full manuals ship in the box and inside Settings → About. Links here are illustrative for the showcase.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

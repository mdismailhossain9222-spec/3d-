import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/policy-page";

export const metadata: Metadata = { title: "Returns" };

export default function ReturnsPage() {
  return (
    <PolicyPage
      kicker="Returns" title="Fourteen days. Opened is fine."
      intro="If it isn't the device you imagined, say so. The bar is honest: physical condition, not unbroken shrink-wrap theatre."
      sections={[
        { heading: "Eligibility", body: ["Phones, watches, buds and power accessories may be returned within 14 days of delivery for any reason."], list: [
          "Device must power on and be free of cracks, liquid ingress or bent frames.",
          "Crimson Edition and numbered Ultra units follow the same 14-day rule — no exception, no asterisk.",
          "Personalised engraving is returnable; we recycle it, not you.",
        ] },
        { heading: "How it runs", body: [
          "Start a return from the order page or with a human on chat. We issue an insured, prepaid label and a pickup slot. The unit passes incoming QC — usually same-day at DHK-01 — and the refund is fired the moment it clears.",
          "Refunds settle to the original method within 3 business days; the gateway, not us, owns that clock.",
        ] },
        { heading: "Exchanges", body: [
          "Want a different configuration? We hold your new unit while the old one travels. One price adjustment, one trip, no re-ordering gymnastics.",
        ] },
      ]}
    />
  );
}

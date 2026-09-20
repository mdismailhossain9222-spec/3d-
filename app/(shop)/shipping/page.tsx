import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/policy-page";

export const metadata: Metadata = { title: "Shipping" };

export default function ShippingPage() {
  return (
    <PolicyPage
      kicker="Logistics" title="Shipping, honestly timed."
      intro="Configured devices leave the workshop within 24 hours. What follows is courier reality, published as we measure it."
      sections={[
        { heading: "Methods & windows", body: ["Three ways to receive a FAISTOF product across Bangladesh. Every parcel is insured to full value and requires a signature at hand-over."], list: [
          "Standard — 2 to 4 business days, ৳299, free above ৳50,000.",
          "Express — next business day for Dhaka & Chattogram, ৳1,500.",
          "Store pickup — reserved at the Banani service bar within 10–20 hours, free.",
        ] },
        { heading: "Fulfilment", body: [
          "Orders pass a two-stage gate: configurator QC (serial binding, color match, battery cycle-zero test) and pack-out under camera. You can watch both stages from your order page — the timeline is event-sourced, not decoration.",
          "Tracking numbers activate the moment the courier scans the bag, usually 14:00–16:00 on processing days.",
        ] },
        { heading: "Remote regions", body: [
          "Sylhet, Khulna, Rangpur and the riverine south add one working day during monsoon months. We don't promise what couriers can't — windows shown at checkout already include that margin.",
        ] },
        { heading: "Damage on arrival", body: [
          "Refuse the parcel or film the seal within 12 hours. Either path gets you a replacement unit dispatched the same day, no repair-shop detour.",
        ] },
      ]}
    />
  );
}

import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/policy-page";

export const metadata: Metadata = { title: "Warranty" };

export default function WarrantyPage() {
  return (
    <PolicyPage
      kicker="Warranty" title="Two years, no small print."
      intro="Every FAISTOF phone ships with a 2-year limited warranty. Accessories carry 1 year (6 months for chargers and cases). Here's the entire promise, in plain text."
      sections={[
        { heading: "What's covered", body: [], list: [
          "Board, display, hinge-free chassis warping, camera modules and fingerprint glass.",
          "Battery below 80% capacity within the term — replaced, not topped, with the service attestation logged to your account.",
          "FAISTOF service-mode diagnostics and firmware recovery, always free.",
        ] },
        { heading: "What isn't", body: [
          "Impact damage, liquid beyond the stated IP rating, unauthorised repairs and the cosmetic dents that map your years honestly. Crimson Care (Ultra) adds two accidental-damage repairs a year with a ৳3,000 deductible — purchased in checkout as an add-on.",
        ] },
        { heading: "Service paths", body: [
          "Walk in to any FAISTOF service bar (Banani, Gulshan-2, Chattogram Avenue) for bench diagnosis inside 90 minutes. Courier service collects from 64 districts, insured both directions.",
          "If a repair crosses 10 working days, the unit is replaced with an equivalent serial — that's the commitment, measured monthly and published in our service report.",
        ] },
        { heading: "Proof", body: [
          "The invoice number is the warranty. It lives in your account forever; no card, no registration, no email-hunt.",
        ] },
      ]}
    />
  );
}

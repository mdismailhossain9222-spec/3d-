import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/policy-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PolicyPage
      kicker="Legal" title="Privacy, the short long version."
      intro="We collect what a store needs and nothing it doesn't. No ad SDKs ship in our software, ever."
      sections={[
        { heading: "What we store", body: ["Account (email, name, phone you choose to add), addresses, orders, warranty records, device diagnostics only if you opt in. Payment data never touches our servers — card fields go to the gateway directly."], list: [] },
        { heading: "Analytics", body: [
          "Page views are aggregated without identifiers or cookies beyond your session. The numbers powering this demo store's admin are the same shape as production — paths and days, nothing personal.",
        ] },
        { heading: "Your controls", body: [
          "Export, correct, or delete everything from the account section. Deletion cascades to orders after statutory tax-retention windows close (5 years, Bangladesh law)." ], list: [
          "Delete account → identity erased; invoices anonymized.",
          "Revoke diagnostics → no further telemetry; warranty claims still possible manually.",
        ] },
        { heading: "Contact", body: ["privacy@faistof.com answers within 5 working days. For this fictional showcase, the mailbox is illustrative."], list: [] },
      ]}
    />
  );
}

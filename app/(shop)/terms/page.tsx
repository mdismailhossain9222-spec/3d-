import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy/policy-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <PolicyPage
      kicker="Legal" title="Terms of sale & use."
      intro="The agreement between you and FAISTOF Commerce Ltd. Written to be read, not survived."
      sections={[
        { heading: "The showcase clause", body: [
          "FAISTOF is a fictional brand built to demonstrate production engineering. Nothing here is a genuine sale: no stock moves, no money changes hands, no cards are charged — the gateway is a sandbox whose only job is to behave exactly like a real one.",
        ] },
        { heading: "Orders & pricing", body: [
          "In a real store: an order is an offer to buy; we accept it at payment capture. Prices include VAT at 5% and update only with notice; obvious pricing errors (0 or negative) don't bind us.",
          "Configurations are reserved for 30 minutes during checkout. Stock shown at add-to-cart is a read at that moment; the server re-validates at order creation and will tell you honestly if a configuration has moved.",
        ] },
        { heading: "Accounts", body: [
          "One human per account. Protect your session the way you'd protect the device: strong password, signed out of shared machines. We can suspend accounts used to abuse the store or the people in it.",
        ] },
        { heading: "Conduct & IP", body: [
          "Product designs, copy and renders are fictional property created for this project. Don't rip the store's code and re-skin it as commerce you didn't build.",
        ] },
        { heading: "Law", body: ["This showcase runs on the laws of physics and Next.js. A real store would name Bangladesh law and the courts of Dhaka."], list: [] },
      ]}
    />
  );
}

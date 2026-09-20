import Link from "next/link";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import {
  AISection, BatterySection, CameraSection, ClosingCTA, ColorSection,
  CollectionSection, ConnectivitySection, DealsTeaser, DesignSection,
  DisplaySection, PerformanceSection,
} from "@/components/home/sections";
import { getHomeData, getProductBySlug, listProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ phones, accessories, sale }, one] = await Promise.all([
    getHomeData(),
    getProductBySlug("faistof-one"),
  ]);
  const phoneViews = phones.length ? phones : [];
  // fetch full views for the collection grid (small catalog — direct query)
  const [phoneFull, accFull] = await Promise.all([
    listProducts({ categories: ["phones"], sort: "featured", full: true, perPage: 4 }),
    listProducts({ categories: ["accessories"], full: true, perPage: 4 }),
  ]);
  void phoneViews; void accessories;

  return (
    <>
      <Navbar />
      <main id="main">
        <Suspense fallback={<div className="grid h-screen place-items-center text-ash"><img src="/renders/hero-obsidian.jpg" alt="Loading" className="h-32 w-auto opacity-60 animate-pulse" /></div>}>
          <Hero product={one} />
        </Suspense>
        <DesignSection />
        <PerformanceSection />
        <CameraSection />
        <DisplaySection />
        <BatterySection />
        <AISection />
        <ConnectivitySection />
        <ColorSection product={one} />
        <CollectionSection products={phoneFull.items} accessories={accFull.items} />
        <DealsTeaser deals={sale} />
        <ClosingCTA />
        <p className="sr-only">
          FAISTOF is a fictional premium technology brand built as a demonstration of production engineering.
        </p>
      </main>
      <Footer />
      <Link href="#main" className="sr-only">Back to content</Link>
    </>
  );
}

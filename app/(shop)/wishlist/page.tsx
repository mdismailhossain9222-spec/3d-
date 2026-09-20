import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { SectionHead } from "@/components/ui/bits";
import { WishlistClient } from "@/components/account/wishlist-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wishlist", description: "Products you saved for later." };

export default async function WishlistPage() {
  const session = await getSession();
  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 pt-32 md:px-8">
      <SectionHead kicker="Saved" title="Your shortlist." sub="Wishlist state is real: it persists in this browser and syncs to your account when signed in." />
      <div className="mt-8">
        <WishlistClient canLogin={Boolean(session)} />
      </div>
    </div>
  );
}

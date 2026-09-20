import { WishlistClient } from "@/components/account/wishlist-client";

export default function AccountWishlistPage() {
  return (
    <div>
      <h2 className="mb-5 font-display text-lg font-bold uppercase tracking-tight">Saved items</h2>
      <WishlistClient canLogin />
    </div>
  );
}

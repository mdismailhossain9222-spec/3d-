"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, ArrowRight } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Quantity } from "@/components/ui/quantity";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/bits";
import { useCart } from "@/lib/store";
import { formatTk } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/money";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart();

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={`Your Cart${cart.count ? ` (${cart.count})` : ""}`}
      footer={
        cart.items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-ash">Subtotal</span>
              <span className="num font-mono text-[15px] font-semibold">{formatTk(cart.subtotal)}</span>
            </div>
            <p className="text-[11px] text-ash">
              {cart.subtotal >= FREE_SHIPPING_THRESHOLD
                ? "Standard shipping is free on this order."
                : `${formatTk(FREE_SHIPPING_THRESHOLD - cart.subtotal)} away from free standard shipping.`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href="/cart" variant="outline" size="md" onClick={onClose}>View cart</ButtonLink>
              <ButtonLink href="/checkout" size="md">Checkout<ArrowRight className="h-3.5 w-3.5" /></ButtonLink>
            </div>
          </div>
        ) : undefined
      }
    >
      {cart.items.length === 0 ? (
        <EmptyState
          illustration="cart"
          title="Your cart is waiting."
          body="Nothing chosen yet. The flagship collection is one tap away."
          cta={<ButtonLink href="/shop" size="md" onClick={onClose}>Explore collection</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col">
          <AnimatePresence initial={false}>
            {cart.items.map((l) => (
              <motion.li
                key={l.variantId}
                layout
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                className="flex gap-3.5 border-b border-white/[0.06] py-4"
              >
                <Link href={`/product/${l.slug}`} className="sr-only">{l.name}</Link>
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-iron p-2">
                  <img src={l.image} alt={l.name} className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[13px] font-semibold">{l.name}</p>
                  {l.label && <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-ash">{l.label}</p>}
                  <div className="mt-2.5 flex items-center justify-between">
                    <Quantity size="sm" value={l.qty} onChange={(n) => cart.setQty(l.variantId, n)} max={l.stock} />
                    <div className="flex items-center gap-2.5">
                      <span className="num font-mono text-[12.5px]">{formatTk(l.price * l.qty)}</span>
                      <button
                        onClick={() => cart.remove(l.variantId)}
                        aria-label={`Remove ${l.name} from cart`}
                        className="rounded-sm p-1.5 text-ash transition-all hover:bg-ember/10 hover:text-ember active:scale-90"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Drawer>
  );
}

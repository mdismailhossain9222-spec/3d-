import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTk } from "@/lib/money";
import { OrderTimeline } from "@/components/account/order-timeline";
import { Badge } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { parseJson } from "@/lib/utils";
import { ArrowRight, Heart, Package, Sparkles } from "lucide-react";

export default async function AccountOverview() {
  const u = await requireUser();
  const [orders, wishCount, ordersCount] = await Promise.all([
    prisma.order.findMany({ where: { userId: u.id }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.wishlistItem.count({ where: { wishlist: { userId: u.id } } }),
    prisma.order.count({ where: { userId: u.id } }),
  ]);

  return (
    <div className="space-y-8">
      <section aria-label="Dashboard stats" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Orders", value: ordersCount, href: "/account/orders", icon: <Package className="h-4 w-4" /> },
          { label: "Saved items", value: wishCount, href: "/account/wishlist", icon: <Heart className="h-4 w-4" /> },
          { label: "FAISTOF points", value: ordersCount * 250 + wishCount * 15, href: "/support", icon: <Sparkles className="h-4 w-4" /> },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="group glass rounded-lg p-5 transition-all hover:-translate-y-0.5 hover:border-crimson/40">
            <span className="flex items-center justify-between text-crimson">{s.icon}<ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" /></span>
            <p className="num mt-3 font-display text-3xl font-bold">{s.value}</p>
            <p className="label-tech mt-1">{s.label}</p>
          </Link>
        ))}
      </section>

      <section aria-labelledby="recent-h">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="recent-h" className="font-display text-lg font-bold uppercase tracking-tight">Recent orders</h2>
          <Link href="/account/orders" className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-crimson hover:underline">All orders →</Link>
        </div>
        {orders.length === 0 ? (
          <div className="glass-deep rounded-lg p-10 text-center">
            <p className="font-display text-[15px] font-semibold">No orders yet.</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] text-ash">When you configure and claim a device, its journey from DHK-01 to your door lives here.</p>
            <ButtonLink href="/shop" size="md" className="mt-5">Start shopping</ButtonLink>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="group glass block rounded-lg p-5 transition-all hover:border-crimson/30">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="num font-mono text-[12.5px] text-crimson">{o.number}</p>
                    <p className="text-[11px] text-ash">{new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <Badge tone={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "crimson" : "outline"}>{o.status.replace(/_/g, " ")}</Badge>
                    <p className="num ml-auto font-mono text-[13px] font-semibold">{formatTk(o.total)}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {o.items.slice(0, 3).map((it) => (
                        <span key={it.id} className="h-10 w-9 rounded-sm border border-white/10 bg-iron p-1">
                          <img src={it.image ?? "/renders/hero-obsidian.jpg"} alt="" className="h-full w-full object-contain" />
                        </span>
                      ))}
                    </div>
                    <p className="text-[11.5px] text-ash">{o.items.reduce((n, i) => n + i.quantity, 0)} item(s)</p>
                    <div className="ml-auto w-full max-w-[340px]"><OrderTimeline status={o.status} events={parseJson(o.timelineJson, [])} compact /></div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

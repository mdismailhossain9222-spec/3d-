import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTk } from "@/lib/money";
import { Badge, EmptyState } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/button";
import { OrderTimeline } from "@/components/account/order-timeline";
import { parseJson } from "@/lib/utils";

export default async function OrdersPage() {
  const u = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: u.id }, include: { items: true }, orderBy: { createdAt: "desc" },
  });

  if (!orders.length) {
    return (
      <div className="glass-deep rounded-lg">
        <EmptyState
          illustration="receipt"
          title="No orders yet."
          body="Your purchase history and tracking will assemble itself here the moment an order is confirmed."
          cta={<ButtonLink href="/shop">Start shopping</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-5 font-display text-lg font-bold uppercase tracking-tight">Order history</h2>
      <ul className="space-y-4">
        {orders.map((o) => (
          <li key={o.id} className="glass-deep rounded-lg p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/account/orders/${o.id}`} className="num font-mono text-[13px] text-crimson transition-colors hover:text-ember">{o.number}</Link>
              <span className="text-[11.5px] text-ash">{new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
              <Badge tone={o.status === "DELIVERED" ? "success" : o.status === "CANCELLED" ? "crimson" : "outline"}>{o.status.replace(/_/g, " ")}</Badge>
              <Badge tone={o.paymentStatus === "PAID" ? "success" : "neutral"}>{o.paymentStatus}</Badge>
              <p className="num ml-auto font-mono text-[14px] font-semibold">{formatTk(o.total)}</p>
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_320px]">
              <ul className="space-y-2.5">
                {o.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3">
                    <span className="h-11 w-10 shrink-0 rounded-sm border border-white/[0.07] bg-iron p-1"><img src={it.image ?? "/renders/hero-obsidian.jpg"} alt="" className="h-full w-full object-contain" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium">{it.name} <span className="text-ash">×{it.quantity}</span></span>
                      {it.label && <span className="block truncate font-mono text-[10px] uppercase tracking-widest text-ash">{it.label}</span>}
                    </span>
                    <span className="num font-mono text-[11.5px] text-mist">{formatTk(it.total)}</span>
                  </li>
                ))}
              </ul>
              <OrderTimeline status={o.status} events={parseJson(o.timelineJson, [])} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Link href={`/account/orders/${o.id}`} className="rounded-sm border border-white/12 px-3.5 py-1.5 text-[11px] text-mist transition-colors hover:border-crimson/50 hover:text-white">Full detail</Link>
              {o.status === "DELIVERED" && (
                <Link href="/support" className="rounded-sm border border-white/12 px-3.5 py-1.5 text-[11px] text-mist transition-colors hover:border-crimson/50 hover:text-white">Need help?</Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

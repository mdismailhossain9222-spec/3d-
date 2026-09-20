import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTk } from "@/lib/money";
import { Badge } from "@/components/ui/bits";
import { OrderTimeline } from "@/components/account/order-timeline";
import { CancelOrderButton } from "@/components/account/cancel-order";
import { parseJson, fmtDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { number: id }], userId: u.id },
    include: { items: true, payments: true },
  });
  if (!order) notFound();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <Link href="/account/orders" className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ash transition-colors hover:text-white">← Orders</Link>
        <h2 className="num font-display text-xl font-bold tracking-tight">{order.number}</h2>
        <Badge tone={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "crimson" : "outline"}>{order.status.replace(/_/g, " ")}</Badge>
        <Badge tone={order.paymentStatus === "PAID" ? "success" : "neutral"}>{order.paymentStatus}</Badge>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="glass-deep rounded-lg p-5">
            <h3 className="label-tech mb-3">Items</h3>
            <ul className="divide-y divide-white/[0.06]">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-4 py-3">
                  <img src={it.image ?? "/renders/hero-obsidian.jpg"} alt="" className="h-14 w-12 object-contain" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[13px] font-semibold">{it.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ash">{it.label} · {it.sku}</p>
                  </div>
                  <p className="num text-right font-mono text-[12.5px]">{formatTk(it.unitPrice)} × {it.quantity}<br /><span className="text-mist">{formatTk(it.total)}</span></p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-4 text-[12.5px]">
              <div className="flex justify-between"><dt className="text-ash">Subtotal</dt><dd className="num font-mono">{formatTk(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-400"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd className="num font-mono">− {formatTk(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ash">Shipping · {order.deliveryMethod}</dt><dd className="num font-mono">{order.shipping ? formatTk(order.shipping) : "FREE"}</dd></div>
              <div className="flex justify-between"><dt className="text-ash">Tax</dt><dd className="num font-mono">{formatTk(order.tax)}</dd></div>
              <div className="flex justify-between border-t border-white/[0.07] pt-2 text-[15px] font-semibold"><dt>Total</dt><dd className="num font-mono text-crimson">{formatTk(order.total)}</dd></div>
            </dl>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="glass-deep rounded-lg p-5">
              <h3 className="label-tech mb-2">Shipping to</h3>
              <p className="text-[13px] font-medium">{order.shipName}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ash">{order.shipLine1}{order.shipLine2 ? `, ${order.shipLine2}` : ""}<br />{order.shipCity} {order.shipPostal}, {order.shipCountry}<br />{order.shipPhone}</p>
            </section>
            <section className="glass-deep rounded-lg p-5">
              <h3 className="label-tech mb-2">Payment</h3>
              {order.payments.map((p) => (
                <p key={p.id} className="text-[12.5px] text-ash">
                  <span className="text-mist">{p.provider}</span> · {p.method}{p.last4 && ` ···· ${p.last4}`} · <span className={p.status === "SUCCEEDED" ? "text-emerald-400" : "text-ash"}>{p.status}</span>
                </p>
              ))}
              <p className="mt-2 text-[11px] text-ash">Placed {fmtDateTime(order.createdAt)} · {order.giftNote && <span className="italic">“{order.giftNote}”</span>}</p>
            </section>
          </div>
        </div>

        <aside className="glass-deep h-fit rounded-lg p-5">
          <h3 className="label-tech mb-4">Tracking</h3>
          <OrderTimeline status={order.status} events={parseJson(order.timelineJson, []) as { status: string; at: string; note?: string }[]} />
          {(order.status === "PLACED" || order.status === "CONFIRMED") && (
            <CancelOrderButton orderId={order.id} />
          )}
        </aside>
      </div>
    </div>
  );
}

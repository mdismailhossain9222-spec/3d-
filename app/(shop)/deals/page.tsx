import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { toView } from "@/lib/queries";
import { DealsBoard } from "@/components/shop/deals-board";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deals",
  description: "Live FAISTOF offers — flash windows, flagship savings and ecosystem bundles, timed by real clocks.",
};

export default async function DealsPage() {
  const now = new Date();
  const [dealRows, couponRows] = await Promise.all([
    prisma.deal.findMany({
      where: { endsAt: { gte: now } },
      include: {
        products: {
          include: {
            category: true,
            images: { orderBy: { position: "asc" } },
            variants: { where: { isActive: true }, include: { inventory: true }, orderBy: { price: "asc" } },
            deal: true,
          },
        },
      },
      orderBy: { endsAt: "asc" },
    }),
    prisma.coupon.findMany({ where: { isActive: true, OR: [{ endsAt: null }, { endsAt: { gte: now } }] } }),
  ]);

  const deals = dealRows.map((d) => ({
    id: d.id, title: d.title, subtitle: d.subtitle, type: d.type, badge: d.badge, banner: d.banner,
    startsAt: d.startsAt.toISOString(), endsAt: d.endsAt.toISOString(),
    products: (d.products as unknown[]).map((p) => toView(p as never)),
  }));
  const coupons = couponRows.map((c) => ({
    code: c.code, description: c.description, type: c.type, value: c.value,
    minSubtotal: c.minSubtotal, endsAt: c.endsAt?.toISOString() ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-[1380px] px-4 pb-24 pt-32 md:px-8">
      <DealsBoard deals={deals} coupons={coupons} />
    </div>
  );
}

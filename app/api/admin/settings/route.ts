import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";

export const GET = () =>
  admin(async () => {
    const rows = await prisma.storeSetting.findMany();
    return NextResponse.json({ ok: true, settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
  });

export const PATCH = (req: Request) =>
  admin(async () => {
    const patch = await body(req);
    const allowed = ["taxRate", "freeShippingAbove", "shippingStandard", "shippingExpress", "storeName", "supportEmail", "heroMode"];
    for (const [k, v] of Object.entries(patch)) {
      if (!allowed.includes(k)) continue;
      await prisma.storeSetting.upsert({ where: { key: k }, create: { key: k, value: String(v) }, update: { value: String(v) } });
    }
    return NextResponse.json({ ok: true });
  });

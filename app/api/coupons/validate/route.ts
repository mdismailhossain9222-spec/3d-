import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { evaluateCoupon } from "@/lib/coupon";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "");
  const subtotal = Math.max(0, Math.trunc(Number(body.subtotal) || 0));
  const session = await getSession();
  const result = await evaluateCoupon(code, subtotal, session?.id);
  return NextResponse.json({ ok: result.valid, ...result }, { status: result.valid ? 200 : 422 });
}

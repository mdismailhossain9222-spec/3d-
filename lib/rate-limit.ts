// API rate-limiting middleware (memory-based, no external DB required)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 30;      // 30 requests/min per IP

const store = new Map<string, { count: number; reset: number }>();

export function rateLimit(req: NextRequest) {
  const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  let entry = store.get(ip);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + windowMs };
    store.set(ip, entry);
  }
  entry.count++;
  if (entry.count > maxRequests) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });
  }
  return null; // allow
}

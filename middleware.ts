import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySession(token) : null;

  // Admin API: enforce on the route itself too (defense in depth), but block early here.
  if (pathname.startsWith("/api/admin")) {
    const apiRes = NextResponse.next();
    apiRes.headers.set("X-Frame-Options", "DENY");
    apiRes.headers.set("X-Content-Type-Options", "nosniff");
    apiRes.headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none';");
    if (!payload) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: apiRes.headers });
    if (payload.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403, headers: apiRes.headers });
    return apiRes;
  }

  const isProtected =
    pathname.startsWith("/account") || pathname.startsWith("/admin") || pathname === "/checkout";
  if (isProtected && !payload) {
    const url = req.nextUrl.clone();
    const target = pathname.startsWith("/admin") ? "/login?next=/admin" : `/login?next=${encodeURIComponent(pathname)}`;
    url.pathname = target.split("?")[0];
    url.search = target.split("?")[1] ? `?${target.split("?")[1]}` : "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (payload) {
    res.headers.set("x-fs-user", "1");
    res.headers.set("x-fs-role", payload.role);
  }
  return res;
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/api/admin/:path*", "/checkout/:path*", "/checkout"],
};

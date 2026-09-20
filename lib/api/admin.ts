import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

/** Wraps an admin route handler: authorization + uniform error shape. */
export async function admin(
  fn: () => Promise<NextResponse | Record<string, unknown>>
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const result = await fn();
    return result instanceof NextResponse ? result : NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const err = e as { message?: string; code?: string; issues?: { path: (string | number)[]; message: string }[] };
    if (err.code === "FORBIDDEN" || err.code === "UNAUTHORIZED") {
      return NextResponse.json({ ok: false, error: err.message }, { status: 403 });
    }
    if (err.issues) {
      const fieldErrors: Record<string, string> = {};
      err.issues.forEach((i) => (fieldErrors[i.path.join(".")] = i.message));
      return NextResponse.json({ ok: false, error: err.issues[0]?.message, fieldErrors }, { status: 422 });
    }
    console.error("[admin:error]", e);
    return NextResponse.json({ ok: false, error: err.message ?? "Admin operation failed." }, { status: 500 });
  }
}

export async function body(req: Request) {
  return req.json().catch(() => ({}));
}

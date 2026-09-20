import { cache } from "react";
import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export type AccountSession = { id: string; email: string; name: string; role: string };

/** Current session from cookie, cross-checked against the database. */
export const getSession = cache(async (): Promise<AccountSession | null> => {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, roleKey: true, disabled: true },
  });
  if (!user || user.disabled) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.roleKey };
});

export async function requireUser(): Promise<AccountSession> {
  const s = await getSession();
  if (!s) throw new AuthError("UNAUTHORIZED", "Please sign in to continue.");
  return s;
}

export async function requireAdmin(): Promise<AccountSession> {
  const s = await requireUser();
  if (s.role !== "ADMIN") throw new AuthError("FORBIDDEN", "Administrator access required.");
  return s;
}

export class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Route-handler wrapper: forwards (req, ctx) to the real handler, lets plain
 * objects become JSON responses, keeps returned Responses untouched, and
 * translates thrown errors (auth, zod, malformed JSON) into honest statuses.
 */
type RouteCtx = { params: Promise<Record<string, string>> };
export function safe<Ctx extends { params: Promise<unknown> } = RouteCtx>(
  fn: (req: NextRequest, ctx: Ctx) => Promise<Response | Record<string, unknown> | null | undefined | void> | Response | Record<string, unknown> | null | void
) {
  return async (req: NextRequest, ctx: Ctx): Promise<Response> => {
    try {
      const r = await fn(req, ctx);
      if (r instanceof Response) return r;
      if (r === null || r === undefined) return NextResponse.json({ ok: true });
      const obj = r as Record<string, unknown>;
      return NextResponse.json("ok" in obj ? obj : { ...obj, ok: true });
    } catch (e) {
      if (e instanceof AuthError) {
        return NextResponse.json({ ok: false, error: e.message }, { status: e.code === "FORBIDDEN" ? 403 : 401 });
      }
      if (e instanceof SyntaxError) {
        return NextResponse.json({ ok: false, error: "Invalid request payload." }, { status: 400 });
      }
      const anyErr = e as { issues?: { path?: (string | number)[]; message: string }[] };
      if (anyErr?.issues?.length) {
        const fieldErrors: Record<string, string> = {};
        for (const i of anyErr.issues) fieldErrors[(i.path ?? []).join(".")] = i.message;
        return NextResponse.json(
          { ok: false, error: anyErr.issues[0]?.message ?? "Validation failed.", fieldErrors },
          { status: 422 }
        );
      }
      console.error("[faistof:error]", e);
      return NextResponse.json({ ok: false, error: "Something went wrong on our side. Please try again." }, { status: 500 });
    }
  };
}

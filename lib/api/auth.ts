import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "@/lib/session-token";
import { authSchema, loginSchema, resetSchema } from "@/lib/validators";

const DAY = 86_400_000;

function bad(msg: string, status = 400, fieldErrors?: Record<string, string>) {
  return NextResponse.json({ ok: false, error: msg, fieldErrors }, { status });
}

export async function register(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = authSchema.safeParse(body);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fe[i.path.join(".")] = i.message));
    return bad("Please fix the highlighted fields.", 422, fe);
  }
  const { email, password, name } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) return bad("An account with this email already exists.", 409, { email: "Already registered" });

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(), name, passwordHash: await hashPassword(password),
      roleKey: "CUSTOMER",
    },
  });

  const token = crypto.randomBytes(20).toString("hex");
  await prisma.authToken.create({
    data: { userId: user.id, token, type: "EMAIL_VERIFY", expiresAt: new Date(Date.now() + DAY) },
  });
  const verifyUrl = `/verify-email?token=${token}`;

  const jwt = await signSession({ sub: user.id, email: user.email, name: user.name, role: "CUSTOMER" });
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name },
    // A production build sends this link by email. Here we return it so the
    // flow is completable end-to-end without a mail provider.
    verifyUrl,
  }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, jwt, sessionCookieOptions);
  return res;
}

export async function login(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fe[i.path.join(".")] = i.message));
    return bad("Please fix the highlighted fields.", 422, fe);
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return bad("Email or password is incorrect.", 401, { password: "Invalid credentials" });
  }
  if (user.disabled) return bad("This account has been disabled.", 403);

  const jwt = await signSession({ sub: user.id, email: user.email, name: user.name, role: user.roleKey });
  const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.roleKey } });
  res.cookies.set(SESSION_COOKIE, jwt, sessionCookieOptions);
  return res;
}

export async function logout() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return res;
}

export async function me() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return bad("No active session.", 401);
  const payload = await verifySession(token);
  if (!payload) return bad("Session expired. Please sign in again.", 401);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true, roleKey: true, phone: true, emailVerified: true, marketingOptIn: true, createdAt: true, disabled: true },
  });
  if (!user || user.disabled) return bad("Session invalid.", 401);
  return NextResponse.json({ ok: true, user });
}

export async function forgot(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").toLowerCase().trim();
  const noop = NextResponse.json({ ok: true, sent: true });
  if (!email || !/.+@.+\..+/.test(email)) return noop;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return noop;

  const token = crypto.randomBytes(16).toString("hex");
  await prisma.authToken.create({
    data: { userId: user.id, token, type: "PASSWORD_RESET", expiresAt: new Date(Date.now() + 2 * 3600_000) },
  });
  return NextResponse.json({
    ok: true, sent: true,
    resetUrl: `/reset-password?token=${token}`,
  });
}

export async function reset(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fe[i.path.join(".")] = i.message));
    return bad("Please fix the highlighted fields.", 422, fe);
  }
  const { token, password } = parsed.data;
  const rec = await prisma.authToken.findUnique({ where: { token } });
  if (!rec || rec.type !== "PASSWORD_RESET" || rec.usedAt || rec.expiresAt < new Date()) {
    return bad("This reset link is invalid or has expired. Request a new one.", 410);
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { passwordHash: await hashPassword(password) } }),
    prisma.authToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}

export async function verify(token: string | null) {
  if (!token) return bad("Missing verification token.", 400);
  const rec = await prisma.authToken.findUnique({ where: { token } });
  if (!rec || rec.type !== "EMAIL_VERIFY" || rec.usedAt) return bad("This link is invalid or already used.", 410);
  if (rec.expiresAt < new Date()) return bad("This link has expired. Sign in and request a new one.", 410);
  await prisma.$transaction([
    prisma.user.update({ where: { id: rec.userId }, data: { emailVerified: true } }),
    prisma.authToken.update({ where: { id: rec.id }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ ok: true });
}

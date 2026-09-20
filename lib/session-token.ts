// Edge-safe session JWT (no node-only imports) — used by middleware and server code alike.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "fs_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "faistof-insecure-development-secret"
);

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: string;
};

export async function signSession(payload: SessionPayload, maxAgeSec = 60 * 60 * 24 * 30) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "CUSTOMER"),
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/",
  secure: true,
  maxAge: 60 * 60 * 24 * 30,
};

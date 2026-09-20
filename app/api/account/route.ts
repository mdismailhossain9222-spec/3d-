import { NextResponse } from "next/server";
import { requireUser, safe } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const PATCH = safe(async (req: Request) => {
  const u = await requireUser();
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim().length >= 2) data.name = body.name.trim().slice(0, 60);
  if (typeof body.phone === "string") data.phone = body.phone.slice(0, 20) || null;
  if (typeof body.marketingOptIn === "boolean") data.marketingOptIn = body.marketingOptIn;
  await prisma.user.update({ where: { id: u.id }, data });
  return NextResponse.json({ ok: true });
});

export const POST = safe(async (req: Request) => {
  // change password
  const u = await requireUser();
  const { currentPassword, newPassword } = await req.json();
  if (typeof newPassword !== "string" || newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[A-Za-z]/.test(newPassword)) {
    return { ok: false, error: "New password needs 8+ characters with letters and numbers." } as never;
  }
  const me = await prisma.user.findUnique({ where: { id: u.id } });
  if (!me || !(await bcrypt.compare(String(currentPassword ?? ""), me.passwordHash))) {
    return { ok: false, error: "Current password is incorrect." } as never;
  }
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  return NextResponse.json({ ok: true });
});

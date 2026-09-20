import { NextResponse } from "next/server";
import { requireUser, safe } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addressSchema } from "@/lib/validators";

export const GET = safe(async () => {
  const u = await requireUser();
  const addresses = await prisma.address.findMany({ where: { userId: u.id }, orderBy: [{ isDefault: "desc" }] });
  return NextResponse.json({ ok: true, addresses });
});

export const POST = safe(async (req: Request) => {
  const u = await requireUser();
  const data = addressSchema.parse(await req.json());
  const count = await prisma.address.count({ where: { userId: u.id } });
  const address = await prisma.address.create({ data: { ...data, userId: u.id, isDefault: count === 0 } });
  return NextResponse.json({ ok: true, address });
});

export const PATCH = safe(async (req: Request) => {
  const u = await requireUser();
  const { id, ...rest } = await req.json();
  const data = addressSchema.parse(rest);
  if (rest.isDefault === undefined && rest.setDefault === true) {
    await prisma.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
  }
  const address = await prisma.address.update({ where: { id }, data: { ...data, userId: u.id } as never });
  return NextResponse.json({ ok: true, address });
});

export const DELETE = safe(async (req: Request) => {
  const u = await requireUser();
  const { id } = await req.json();
  await prisma.address.deleteMany({ where: { id, userId: u.id } });
  return NextResponse.json({ ok: true });
});

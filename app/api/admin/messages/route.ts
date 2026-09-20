import { NextResponse } from "next/server";
import { admin, body } from "@/lib/api/admin";
import { prisma } from "@/lib/db";

export const GET = () =>
  admin(async () => {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ ok: true, messages });
  });

export const PATCH = (req: Request) =>
  admin(async () => {
    const { id, handled } = await body(req);
    await prisma.contactMessage.update({ where: { id }, data: { handled: Boolean(handled) } });
    return NextResponse.json({ ok: true });
  });

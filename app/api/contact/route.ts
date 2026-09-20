import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const parsed = contactSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const fe: Record<string, string> = {};
    parsed.error.issues.forEach((i) => (fe[i.path.join(".")] = i.message));
    return NextResponse.json({ ok: false, error: "Check the form.", fieldErrors: fe }, { status: 422 });
  }
  await prisma.contactMessage.create({ data: parsed.data });
  return NextResponse.json({ ok: true });
}

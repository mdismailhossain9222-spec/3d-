import { NextResponse } from "next/server";
import { verify } from "@/lib/api/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return verify(typeof body.token === "string" ? body.token : null);
}

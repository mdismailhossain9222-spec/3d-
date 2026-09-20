import { login } from "@/lib/api/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const limited = rateLimit(req as any);
  if (limited) return limited;
  return login(req);
}

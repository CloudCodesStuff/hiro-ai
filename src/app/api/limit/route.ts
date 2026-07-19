import { getRemaining, getRateLimitIdentifier } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const identifier = getRateLimitIdentifier(req);
  const { remaining, limit, limitReached } = getRemaining(identifier);

  return Response.json({ remaining, limit, limitReached });
}

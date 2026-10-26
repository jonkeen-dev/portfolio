type Bucket = { resetAt: number; count: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  if (process.env.RATE_LIMIT_DISABLED === "1") return { ok: true, remaining: limit };
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { resetAt: now + windowMs, count: 1 });
    return { ok: true, remaining: limit - 1 };
  }
  if (current.count >= limit) return { ok: false, remaining: 0 };
  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

export function clientKey(headers: Headers, suffix: string): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip") || "local";
  return `${suffix}:${ip}`;
}

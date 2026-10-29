import { createHash } from "node:crypto";

import { env } from "@/lib/env";

export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${env().BETTER_AUTH_SECRET}:${ip}`).digest("hex").slice(0, 32);
}

/** Browser family only. The raw user agent is not stored. */
export function uaFamily(ua: string | null | undefined): string | null {
  if (!ua) return null;
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iOS/i.test(ua)) return "iOS";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome/i.test(ua)) return "Chrome";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua)) return "Safari";
  return "Other";
}

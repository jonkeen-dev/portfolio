import { appOrigin } from "@/lib/env";

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(appOrigin()).host;
  } catch {
    return false;
  }
}

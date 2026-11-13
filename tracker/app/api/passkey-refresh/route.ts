import { APIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import { safePasskeyCode, safePasskeyStatus } from "@/lib/passkey-errors";
import { sameOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function failureStatus(error: unknown): number {
  if (error instanceof APIError) return safePasskeyStatus(error.statusCode);
  return 500;
}

function failureCode(error: unknown): string {
  if (error instanceof APIError && error.body && typeof error.body === "object" && "code" in error.body) {
    return safePasskeyCode(error.body.code);
  }
  return "UNKNOWN";
}

/** Send a fresh email sign-in link for the signed-in user. The address stays on the server. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ ok: false, code: "FORBIDDEN" }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.email) return Response.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const limit = rateLimit(`passkey-refresh:${session.user.id}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return Response.json({ ok: false, code: "RATE_LIMITED" }, { status: 429 });
  try {
    await auth.api.signInMagicLink({
      body: {
        email: session.user.email,
        callbackURL: "/settings/security",
      },
      headers: request.headers,
    });
  } catch (error) {
    const status = failureStatus(error);
    const code = failureCode(error);
    console.info(JSON.stringify({ event: "passkey_refresh_link_failed", status, code }));
    if (status === 429 || code === "TOO_MANY_REQUESTS") {
      return Response.json({ ok: false, code: "RATE_LIMITED" }, { status: 429 });
    }
    return Response.json({ ok: false, code: "UNAVAILABLE" }, { status: status || 503 });
  }
  return Response.json({ ok: true });
}

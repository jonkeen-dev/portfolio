import { NextResponse, type NextRequest } from "next/server";

import { handleAllowsIndexing } from "@/lib/indexable-file";

function csp(nonce: string): string {
  const script =
    process.env.NODE_ENV === "production"
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : `script-src 'self' 'unsafe-inline' 'unsafe-eval'`;
  return [
    "default-src 'self'",
    script,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://i.ytimg.com",
    "frame-src https://www.youtube-nocookie.com",
    "connect-src 'self'",
    "worker-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const policy = csp(nonce);
  requestHeaders.set("content-security-policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);

  const path = request.nextUrl.pathname;
  if (path.startsWith("/u/")) {
    const handle = decodeURIComponent(path.split("/")[2] ?? "");
    const indexable = handle.length > 0 && handleAllowsIndexing(handle);
    response.headers.set("X-Robots-Tag", indexable ? "index, follow" : "noindex");
    response.headers.set("Cache-Control", "no-store");
  } else {
    response.headers.set("X-Robots-Tag", "noindex");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|sw.js).*)"],
};

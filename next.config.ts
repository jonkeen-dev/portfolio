import type { NextConfig } from "next";

/**
 * Static CSP (no nonce). Nonces would force every page to render dynamically.
 * 'unsafe-inline' covers Next's bootstrap scripts and framer-motion style attributes.
 * 'unsafe-eval' is dev-only (React debugging). Production analytics beacons go to
 * same-origin /_vercel/* or https://vitals.vercel-insights.com; dev scripts load
 * from https://va.vercel-scripts.com.
 */
function contentSecurityPolicy() {
  const isDev = process.env.NODE_ENV === "development";

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    [
      "connect-src 'self'",
      "https://va.vercel-scripts.com",
      "https://vitals.vercel-insights.com",
      isDev ? "ws: wss:" : "",
    ]
      .filter(Boolean)
      .join(" "),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy() },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: [
              "accelerometer=()",
              "camera=()",
              "geolocation=()",
              "gyroscope=()",
              "magnetometer=()",
              "microphone=()",
              "payment=()",
              "usb=()",
              "interest-cohort=()",
              "browsing-topics=()",
            ].join(", "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

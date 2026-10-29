import type { Metadata } from "next";
import { headers } from "next/headers";

import { FlushQueue } from "@/components/flush-queue";
import { Providers } from "@/components/providers";
import { SwRegister } from "@/components/sw-register";

import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Calisthenics Tracker", template: "%s · Calisthenics Tracker" },
  description: "A private training log for a 12-week bodyweight program.",
  applicationName: "Calisthenics Tracker",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers nonce={nonce}>
          <a className="skip" href="#main">
            Skip to content
          </a>
          {children}
          <SwRegister />
          <FlushQueue />
        </Providers>
      </body>
    </html>
  );
}

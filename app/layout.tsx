import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/providers";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";
import PageTransition from "@/components/motion/page-transition";
import { siteUrl } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "jonkeen.dev",
    template: "%s — jonkeen.dev",
  },
  description:
    "Jon Keen — software engineer with twenty years in retail and analysis, and a habit of asking why first.",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "jonkeen.dev",
    description:
      "Jon Keen — software engineer with twenty years in retail and analysis, and a habit of asking why first.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "jonkeen.dev — Jon Keen, Software Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "jonkeen.dev",
    description:
      "Jon Keen — software engineer with twenty years in retail and analysis, and a habit of asking why first.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Nav />
          <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}

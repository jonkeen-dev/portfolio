"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/roadmap", label: "Roadmap" },
] as const;

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`text-sm underline-offset-4 transition-colors ${
              active
                ? "text-foreground decoration-foreground underline decoration-2"
                : "text-foreground-secondary hover:text-foreground hover:underline"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}

export default function Nav() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/75 border-border/30 border-b backdrop-blur-md" : "bg-transparent"
      } `}
    >
      <a
        href="#main-content"
        className="focus:bg-background focus:text-foreground focus:ring-accent sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:ring-2 focus:outline-none"
      >
        Skip to content
      </a>
      <div className="mx-auto max-w-5xl px-6">
        {/* Row 1: Brand + desktop nav + right controls */}
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="text-accent-bright text-sm font-medium tracking-tight transition-opacity hover:opacity-75"
          >
            jonkeen.dev
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-bright border-accent-bright/30 hover:bg-accent-bright/10 hidden rounded-md border px-3 py-1.5 text-xs transition-colors sm:inline-flex"
            >
              Resume
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="focus-visible:outline-accent-bright relative inline-flex size-[44px] shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="bg-accent/25 relative flex h-4.5 w-8 items-center rounded-full px-0.5 transition-colors">
                <span
                  suppressHydrationWarning
                  className="bg-accent-bright h-3.5 w-3.5 translate-x-3.5 rounded-full transition-transform duration-300 dark:translate-x-0"
                />
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Mobile nav links */}
        <nav className="flex items-center gap-5 pb-2 md:hidden">
          <NavLinks pathname={pathname} />
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground-secondary hover:text-foreground text-sm underline-offset-4 transition-colors hover:underline sm:hidden"
          >
            Resume
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

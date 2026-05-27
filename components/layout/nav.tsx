"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Nav() {
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/75 border-border/15 border-b backdrop-blur-md" : "bg-transparent"
      } `}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-accent-bright text-sm font-medium tracking-tight transition-opacity hover:opacity-75"
        >
          jonkeen.dev
        </Link>
        <nav className="flex items-center gap-7">
          <Link
            href="/projects"
            className="text-foreground-secondary hover:text-foreground text-sm transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/about"
            className="text-foreground-secondary hover:text-foreground text-sm transition-colors"
          >
            About
          </Link>
          <Link
            href="/roadmap"
            className="text-foreground-secondary hover:text-foreground text-sm transition-colors"
          >
            Roadmap
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-bright border-accent-bright/30 hover:bg-accent-bright/10 rounded-md border px-3 py-1.5 text-xs transition-colors"
          >
            Resume
          </a>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="bg-accent/25 relative flex h-[18px] w-8 items-center rounded-full px-0.5 transition-colors"
          >
            <span
              suppressHydrationWarning
              className="bg-accent-bright h-3.5 w-3.5 translate-x-[14px] rounded-full transition-transform duration-300 dark:translate-x-0"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

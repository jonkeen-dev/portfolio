"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const MotionLink = motion.create(Link);
const navSpring = { type: "spring" as const, stiffness: 500, damping: 30 };

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
        scrolled ? "bg-background/75 border-border/30 border-b backdrop-blur-md" : "bg-transparent"
      } `}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* Row 1: Brand + desktop nav + right controls */}
        <div className="flex h-14 items-center justify-between">
          <Link
            href="/"
            className="text-accent-bright text-sm font-medium tracking-tight transition-opacity hover:opacity-75"
          >
            jonkeen.dev
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <MotionLink
              href="/projects"
              className="text-foreground-secondary hover:text-foreground text-sm transition-colors"
              whileHover={{ scale: 1.2, y: -1 }}
              whileFocus={{ scale: 1.2, y: -1 }}
              transition={navSpring}
            >
              Projects
            </MotionLink>
            <MotionLink
              href="/about"
              className="text-foreground-secondary hover:text-foreground text-sm transition-colors"
              whileHover={{ scale: 1.2, y: -1 }}
              whileFocus={{ scale: 1.2, y: -1 }}
              transition={navSpring}
            >
              About
            </MotionLink>
            <MotionLink
              href="/roadmap"
              className="text-foreground-secondary hover:text-foreground text-sm transition-colors"
              whileHover={{ scale: 1.2, y: -1 }}
              whileFocus={{ scale: 1.2, y: -1 }}
              transition={navSpring}
            >
              Roadmap
            </MotionLink>
          </nav>
          <div className="flex items-center gap-3">
            <motion.a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-bright border-accent-bright/30 hover:bg-accent-bright/10 hidden rounded-md border px-3 py-1.5 text-xs transition-colors sm:inline-flex"
              whileHover={{ scale: 1.1, y: -1 }}
              whileFocus={{ scale: 1.1, y: -1 }}
              transition={navSpring}
            >
              Resume
            </motion.a>
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="bg-accent/25 relative flex h-4.5 w-8 items-center rounded-full px-0.5 transition-colors"
            >
              <span
                suppressHydrationWarning
                className="bg-accent-bright h-3.5 w-3.5 translate-x-3.5 rounded-full transition-transform duration-300 dark:translate-x-0"
              />
            </button>
          </div>
        </div>

        {/* Row 2: Mobile nav links */}
        <nav className="flex items-center gap-5 pb-2 md:hidden">
          <MotionLink
            href="/projects"
            className="text-foreground-secondary hover:text-foreground text-sm transition-colors"
            whileHover={{ y: -1 }}
            whileFocus={{ y: -1 }}
            transition={navSpring}
          >
            Projects
          </MotionLink>
          <MotionLink
            href="/about"
            className="text-foreground-secondary hover:text-foreground text-sm transition-colors"
            whileHover={{ y: -1 }}
            whileFocus={{ y: -1 }}
            transition={navSpring}
          >
            About
          </MotionLink>
          <MotionLink
            href="/roadmap"
            className="text-foreground-secondary hover:text-foreground text-sm transition-colors"
            whileHover={{ y: -1 }}
            whileFocus={{ y: -1 }}
            transition={navSpring}
          >
            Roadmap
          </MotionLink>
          <motion.a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground-secondary hover:text-foreground text-sm transition-colors sm:hidden"
            whileHover={{ y: -1 }}
            whileFocus={{ y: -1 }}
            transition={navSpring}
          >
            Resume
          </motion.a>
        </nav>
      </div>
    </header>
  );
}

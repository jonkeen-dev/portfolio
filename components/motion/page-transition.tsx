"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

/**
 * PageTransition
 * Thin client wrapper, provides restrained, purposeful page enter animation across the site.
 *
 * Applied once in root layout so all routes (incl. 404) inherit automatically.
 * No per-page changes required.
 */
const spring = { stiffness: 600, damping: 30, mass: 0.5 };

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 1 }}
        animate={{ opacity: 1, y: 1 }}
        // Enter-focused: no (or minimal) exit keeps nav feeling instant.
        // Exit can be re-enabled with very short values if desired later.
        transition={{ type: "spring", ...spring }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

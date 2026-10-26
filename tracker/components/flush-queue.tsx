"use client";

import { useEffect } from "react";

import { flushQueue } from "@/components/sync-set";

export function FlushQueue() {
  useEffect(() => {
    const run = () => {
      flushQueue().catch(() => undefined);
    };
    run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, []);
  return null;
}

"use client";

import { useEffect, useState } from "react";

import { browserPasskeyHost, passkeySupport, readPasskeySignals, type PasskeySupport } from "@/lib/passkey-support";

export function usePasskeySupport(): PasskeySupport | null {
  const [support, setSupport] = useState<PasskeySupport | null>(null);
  useEffect(() => {
    let active = true;
    void readPasskeySignals(browserPasskeyHost()).then((signals) => {
      if (active) setSupport(passkeySupport(signals));
    });
    return () => {
      active = false;
    };
  }, []);
  return support;
}

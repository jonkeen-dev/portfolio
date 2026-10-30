"use client";

import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function ThemeChooser() {
  const { theme, setTheme } = useTheme();
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const current = theme ?? "system";
  if (!ready) {
    return (
      <fieldset>
        <legend>Theme</legend>
        <p>Theme options load with this page.</p>
      </fieldset>
    );
  }
  return (
    <fieldset>
      <legend>Theme</legend>
      {(["system", "light", "dark"] as const).map((option) => (
        <label key={option} className="choice">
          <input
            type="radio"
            name="theme"
            value={option}
            checked={current === option}
            onChange={() => setTheme(option)}
          />
          {option === "system" ? "Match this device" : option === "light" ? "Light" : "Dark"}
        </label>
      ))}
    </fieldset>
  );
}

export function PasskeyButton() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div className="stack">
      <Button
        type="button"
        pending={pending}
        pendingLabel="Saving…"
        onClick={async () => {
          setPending(true);
          const result = await authClient.passkey.addPasskey({ name: "This phone" }).catch(() => ({ error: { message: "no" } }));
          setPending(false);
          if (result && "error" in result && result.error) {
            setMessage("Passkey was not saved. Try again on Android Chrome, or keep using email links.");
            return;
          }
          setMessage("Passkey saved on this device.");
        }}
      >
        Add a passkey
      </Button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      pending={pending}
      pendingLabel="Signing out…"
      onClick={async () => {
        setPending(true);
        await authClient.signOut();
        window.location.href = "/sign-in";
      }}
    >
      Sign out
    </Button>
  );
}

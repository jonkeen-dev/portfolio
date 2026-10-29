"use client";

import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";

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
  return (
    <div className="stack">
      <button
        className="tap"
        type="button"
        onClick={async () => {
          const result = await authClient.passkey.addPasskey({ name: "This phone" }).catch(() => ({ error: { message: "no" } }));
          if (result && "error" in result && result.error) {
            setMessage("Passkey was not saved. Try again on Android Chrome, or keep using email links.");
            return;
          }
          setMessage("Passkey saved on this device.");
        }}
      >
        Add a passkey
      </button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}

export function SignOutButton() {
  return (
    <button
      className="tap"
      type="button"
      onClick={async () => {
        await authClient.signOut();
        window.location.href = "/sign-in";
      }}
    >
      Sign out
    </button>
  );
}

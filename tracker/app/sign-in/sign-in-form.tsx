"use client";

import { useState } from "react";

import { authClient } from "@/lib/auth-client";

const NEUTRAL = "If this address can sign in, a link is on its way.";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [passkeyNote, setPasskeyNote] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setPasskeyNote("");
    try {
      await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: `${window.location.origin}/today`,
      });
    } catch {
      /* The same sentence is shown whether or not a link was sent. */
    }
    setNotice(NEUTRAL);
    setPending(false);
  }

  async function onPasskey() {
    setPasskeyNote("");
    const result = await authClient.signIn.passkey().catch(() => ({ error: { message: "failed" } }));
    if (result && "error" in result && result.error) {
      setPasskeyNote("Passkey sign-in did not complete. Use the email link instead.");
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <label htmlFor="email">
        Email
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <button className="tap primary" type="submit" disabled={pending}>
        Email me a sign-in link
      </button>
      {notice ? <p role="status">{notice}</p> : null}
      <button className="tap" type="button" onClick={onPasskey}>
        Sign in with a passkey
      </button>
      {passkeyNote ? <p role="status">{passkeyNote}</p> : null}
      <p className="muted">
        <a href="/privacy">Privacy</a>
      </p>
    </form>
  );
}

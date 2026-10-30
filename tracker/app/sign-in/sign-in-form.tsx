"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";
import { NEUTRAL_AUTH_MESSAGE } from "@/lib/auth-policy";
import { authClient } from "@/lib/auth-client";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [passkeyNote, setPasskeyNote] = useState("");
  const noticeRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasskeyNote("");
    const started = Date.now();
    flushSync(() => setPending(true));
    try {
      await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: `${window.location.origin}/today`,
      });
    } catch {
      /* The same sentence is shown whether or not a link was sent. */
    }
    // A local send returns immediately. Hold the pending label long enough to read.
    const remain = 700 - (Date.now() - started);
    if (remain > 0) await new Promise((resolve) => window.setTimeout(resolve, remain));
    setNotice(NEUTRAL_AUTH_MESSAGE);
    setPending(false);
  }

  async function onPasskey() {
    setPasskeyNote("");
    setPasskeyPending(true);
    const result = await authClient.signIn.passkey().catch(() => ({ error: { message: "failed" } }));
    setPasskeyPending(false);
    if (result && "error" in result && result.error) {
      setPasskeyNote("That didn't work. Try the email link instead.");
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
          onChange={(event) => {
            setEmail(event.target.value);
            setNotice("");
          }}
        />
      </label>
      <Button variant="primary" type="submit" pending={pending} pendingLabel="Sending…">
        Email me a sign-in link
      </Button>
      {notice ? (
        <p ref={noticeRef} tabIndex={-1} role="status">
          {notice}
        </p>
      ) : null}
      <p className="or">
        <span>or</span>
      </p>
      <Button variant="secondary" type="button" pending={passkeyPending} disabled={pending} pendingLabel="Please wait…" onClick={onPasskey}>
        Sign in with a passkey
      </Button>
      {passkeyNote ? <p role="status">{passkeyNote}</p> : null}
      <p>
        <a href="/privacy">Privacy</a>
      </p>
    </form>
  );
}

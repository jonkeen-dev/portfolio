"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  PASSKEY_SAVED_MESSAGE,
  PASSKEY_STALE_LINK_FAILED_MESSAGE,
  PASSKEY_STALE_LINK_SENT_MESSAGE,
  PASSKEY_STALE_LINK_WAIT_MESSAGE,
  PASSKEY_STALE_SESSION_MESSAGE,
  type PasskeyRegistrationFailure,
} from "@/lib/passkey-errors";
import { registerPasskey } from "@/lib/passkey-register";
import { PASSKEY_UNAVAILABLE_MESSAGE } from "@/lib/passkey-support";
import { usePasskeySupport } from "@/lib/use-passkey-support";

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

function CodeTokens({ text }: { text: string }) {
  const parts = text.split("_");
  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {index > 0 ? (
        <>
          _<wbr />
        </>
      ) : null}
      {part}
    </span>
  ));
}

function PasskeyDebugCode({ failure }: { failure: PasskeyRegistrationFailure }) {
  return (
    <p className="small-print meta passkey-code">
      <CodeTokens text={failure.code} />
      {failure.causeName && failure.causeName !== failure.code ? (
        <>
          {" · "}
          <span className="nowrap">{failure.causeName}</span>
        </>
      ) : null}
      {failure.status ? <span className="nowrap">{` · ${failure.status}`}</span> : null}
    </p>
  );
}

function reportCeremony(failure: PasskeyRegistrationFailure) {
  if (failure.stage !== "ceremony") return;
  void fetch("/api/passkey-log", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ stage: "ceremony", status: failure.status, code: failure.code }),
    keepalive: true,
  }).catch(() => undefined);
}

export function PasskeyButton({ sessionFresh }: { sessionFresh: boolean }) {
  const support = usePasskeySupport();
  const [failure, setFailure] = useState<PasskeyRegistrationFailure | null>(null);
  const [saved, setSaved] = useState(false);
  const [linkNote, setLinkNote] = useState("");
  const [pending, setPending] = useState(false);
  const [linkPending, setLinkPending] = useState(false);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const active = useRef(true);
  const stale = !sessionFresh || failure?.needsFreshSession === true;

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  useEffect(() => {
    if (linkNote) noteRef.current?.focus();
  }, [linkNote]);

  async function sendLink() {
    setLinkPending(true);
    setLinkNote("");
    try {
      const response = await fetch("/api/passkey-refresh", { method: "POST" });
      if (!active.current) return;
      if (response.ok) setLinkNote(PASSKEY_STALE_LINK_SENT_MESSAGE);
      else if (response.status === 429) setLinkNote(PASSKEY_STALE_LINK_WAIT_MESSAGE);
      else setLinkNote(PASSKEY_STALE_LINK_FAILED_MESSAGE);
    } catch {
      if (active.current) setLinkNote(PASSKEY_STALE_LINK_FAILED_MESSAGE);
    } finally {
      if (active.current) setLinkPending(false);
    }
  }

  async function addPasskey() {
    setPending(true);
    setSaved(false);
    setFailure(null);
    setLinkNote("");
    let result: Awaited<ReturnType<typeof registerPasskey>>;
    try {
      result = await registerPasskey("This phone");
    } catch {
      result = {
        ok: false,
        failure: {
          stage: "ceremony",
          status: 500,
          code: "UNKNOWN",
          causeName: null,
          guidance: "Passkey was not saved. You can try again, or keep using the email link.",
          needsFreshSession: false,
        },
      };
    }
    if (!active.current) return;
    setPending(false);
    if (!result.ok) {
      setFailure(result.failure);
      reportCeremony(result.failure);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="stack">
      {support?.offer && !stale ? (
        <Button type="button" pending={pending} pendingLabel="Saving…" onClick={addPasskey}>
          Add a passkey
        </Button>
      ) : null}
      {support?.offer && stale ? (
        <>
          <p role="status">{PASSKEY_STALE_SESSION_MESSAGE}</p>
          <Button type="button" variant="primary" pending={linkPending} pendingLabel="Sending…" onClick={sendLink}>
            Email me a sign-in link
          </Button>
        </>
      ) : null}
      {support && !support.offer ? <p role="status">{PASSKEY_UNAVAILABLE_MESSAGE}</p> : null}
      {saved ? <p role="status">{PASSKEY_SAVED_MESSAGE}</p> : null}
      {failure && !stale ? (
        <>
          <p role="status">{failure.guidance}</p>
          <PasskeyDebugCode failure={failure} />
        </>
      ) : null}
      {failure && stale ? <PasskeyDebugCode failure={failure} /> : null}
      {linkNote ? (
        <p ref={noteRef} tabIndex={-1} role="status">
          {linkNote}
        </p>
      ) : null}
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

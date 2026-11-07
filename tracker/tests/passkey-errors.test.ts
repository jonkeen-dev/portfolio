import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import {
  PASSKEY_CANCELLED_MESSAGE,
  PASSKEY_EXISTS_MESSAGE,
  PASSKEY_NO_PROVIDER_MESSAGE,
  PASSKEY_ORIGIN_MESSAGE,
  PASSKEY_SERVER_MESSAGE,
  PASSKEY_SESSION_FRESH_MS,
  PASSKEY_STALE_LINK_FAILED_MESSAGE,
  PASSKEY_STALE_LINK_SENT_MESSAGE,
  PASSKEY_STALE_LINK_WAIT_MESSAGE,
  PASSKEY_STALE_SESSION_MESSAGE,
  mapPasskeyRegistrationFailure,
  observePasskeyRegistrationResponse,
  passkeyCodeFromResponse,
  passkeyFailureRecord,
  registrationStageForPath,
  safePasskeyCode,
  sessionCreatedAtIsFresh,
} from "../lib/passkey-errors";

const BROWSER_NAME = /\b(chrome|firefox|safari|edge|samsung)\b/i;

const COPY = [
  PASSKEY_STALE_SESSION_MESSAGE,
  PASSKEY_STALE_LINK_SENT_MESSAGE,
  PASSKEY_STALE_LINK_WAIT_MESSAGE,
  PASSKEY_STALE_LINK_FAILED_MESSAGE,
  PASSKEY_CANCELLED_MESSAGE,
  PASSKEY_NO_PROVIDER_MESSAGE,
  PASSKEY_EXISTS_MESSAGE,
  PASSKEY_ORIGIN_MESSAGE,
  PASSKEY_SERVER_MESSAGE,
];

describe("passkey registration errors", () => {
  it("keeps Better Auth's default 24 hour fresh window", () => {
    expect(PASSKEY_SESSION_FRESH_MS).toBe(86_400_000);
    const source = readFileSync(new URL("../lib/auth.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/freshAge\s*:/);
  });

  it("treats a session as fresh only before createdAt reaches 24 hours", () => {
    const now = 1_700_000_000_000;
    expect(sessionCreatedAtIsFresh(new Date(now - PASSKEY_SESSION_FRESH_MS + 1), now)).toBe(true);
    expect(sessionCreatedAtIsFresh(new Date(now - PASSKEY_SESSION_FRESH_MS), now)).toBe(false);
    expect(sessionCreatedAtIsFresh(new Date(now - PASSKEY_SESSION_FRESH_MS - 1), now)).toBe(false);
    expect(sessionCreatedAtIsFresh("not-a-date", now)).toBe(false);
    expect(sessionCreatedAtIsFresh(null, now)).toBe(false);
  });

  it("maps a stale session to a plain sign-in prompt and keeps the code", () => {
    const failure = mapPasskeyRegistrationFailure({
      stage: "options",
      code: "SESSION_NOT_FRESH",
      status: 403,
    });
    expect(failure.needsFreshSession).toBe(true);
    expect(failure.guidance).toBe(PASSKEY_STALE_SESSION_MESSAGE);
    expect(failure.code).toBe("SESSION_NOT_FRESH");
    expect(failure.status).toBe(403);
    expect(failure.stage).toBe("options");
  });

  it("maps cancel, missing provider, duplicate, origin, and server failures", () => {
    expect(
      mapPasskeyRegistrationFailure({
        stage: "ceremony",
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        status: 400,
        causeName: "NotAllowedError",
      }),
    ).toMatchObject({ guidance: PASSKEY_CANCELLED_MESSAGE, causeName: "NotAllowedError" });

    expect(
      mapPasskeyRegistrationFailure({
        stage: "ceremony",
        code: "ERROR_CEREMONY_ABORTED",
        status: 400,
        causeName: "AbortError",
      }).guidance,
    ).toBe(PASSKEY_CANCELLED_MESSAGE);

    expect(
      mapPasskeyRegistrationFailure({
        stage: "ceremony",
        code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
        status: 400,
        causeName: "NotSupportedError",
      }).guidance,
    ).toBe(PASSKEY_NO_PROVIDER_MESSAGE);

    expect(
      mapPasskeyRegistrationFailure({
        stage: "ceremony",
        code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
        status: 400,
      }).guidance,
    ).toBe(PASSKEY_NO_PROVIDER_MESSAGE);

    expect(
      mapPasskeyRegistrationFailure({
        stage: "ceremony",
        code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
        status: 400,
        causeName: "InvalidStateError",
      }).guidance,
    ).toBe(PASSKEY_EXISTS_MESSAGE);

    expect(
      mapPasskeyRegistrationFailure({
        stage: "ceremony",
        code: "ERROR_INVALID_RP_ID",
        status: 400,
        causeName: "SecurityError",
      }).guidance,
    ).toBe(PASSKEY_ORIGIN_MESSAGE);

    expect(
      mapPasskeyRegistrationFailure({
        stage: "verify",
        code: "FAILED_TO_VERIFY_REGISTRATION",
        status: 500,
      }).guidance,
    ).toBe(PASSKEY_SERVER_MESSAGE);

    expect(
      mapPasskeyRegistrationFailure({
        stage: "options",
        code: "CHALLENGE_NOT_FOUND",
        status: 400,
      }).guidance,
    ).toBe(PASSKEY_SERVER_MESSAGE);
  });

  it("drops messages, emails, challenges, and cookies from the code", () => {
    expect(safePasskeyCode("user@example.com")).toBe("UNKNOWN");
    expect(safePasskeyCode("Passkey was not saved")).toBe("UNKNOWN");
    expect(safePasskeyCode("dGhpcyBpcyBhIGNoYWxsZW5nZQ")).toBe("UNKNOWN");
    expect(safePasskeyCode("ct_session=abc")).toBe("UNKNOWN");
    expect(safePasskeyCode("SESSION_NOT_FRESH")).toBe("SESSION_NOT_FRESH");
    expect(safePasskeyCode("NotAllowedError")).toBe("NotAllowedError");

    const failure = mapPasskeyRegistrationFailure({
      stage: "verify",
      code: "owner@example.com",
      status: 500,
      causeName: "https://evil.example/challenge",
    });
    expect(failure.code).toBe("UNKNOWN");
    expect(failure.causeName).toBeNull();
    expect(JSON.stringify(failure)).not.toContain("@");
    expect(JSON.stringify(failure)).not.toContain("challenge");
    expect(failure.guidance).toBe(PASSKEY_SERVER_MESSAGE);
  });

  it("logs only stage, status, and a safe code", async () => {
    const lines: string[] = [];
    const spy = vi.spyOn(console, "info").mockImplementation((line: unknown) => {
      lines.push(String(line));
    });
    const response = new Response(
      JSON.stringify({
        code: "SESSION_NOT_FRESH",
        message: "Send the link to owner@example.com",
        challenge: "dGhpcyBpcyBhIGNoYWxsZW5nZQ",
        cookie: "ct_session=secret",
      }),
      { status: 403, headers: { "content-type": "application/json" } },
    );
    const request = new Request("https://tracker.example/api/auth/passkey/generate-register-options");
    await observePasskeyRegistrationResponse(request, response);
    const success = new Response(JSON.stringify({ publicKey: "secret-key", challenge: "another" }), { status: 200 });
    await observePasskeyRegistrationResponse(
      new Request("https://tracker.example/api/auth/passkey/verify-registration"),
      success,
    );
    spy.mockRestore();

    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe(
      JSON.stringify({
        event: "passkey_registration_failed",
        stage: "options",
        status: 403,
        code: "SESSION_NOT_FRESH",
      }),
    );
    expect(lines[0]).not.toContain("@");
    expect(lines[0]).not.toContain("challenge");
    expect(lines[0]).not.toContain("ct_session");
    expect(registrationStageForPath("/api/auth/passkey/verify-registration")).toBe("verify");
    expect(registrationStageForPath("/api/auth/passkey/generate-authenticate-options")).toBeNull();
    expect(await passkeyCodeFromResponse(response.clone())).toBe("SESSION_NOT_FRESH");
  });

  it("redacts unsafe codes inside the log record", () => {
    const record = passkeyFailureRecord({
      stage: "ceremony",
      status: 400,
      code: "owner@example.com",
    });
    expect(record.code).toBe("UNKNOWN");
    expect(JSON.stringify(record)).not.toContain("@");
    expect(passkeyFailureRecord({ stage: "verify", status: 99, code: "FAILED_TO_VERIFY_REGISTRATION" }).status).toBe(0);
  });

  it("keeps the new guidance free of browser names", () => {
    for (const text of COPY) expect(text).not.toMatch(BROWSER_NAME);
  });
});

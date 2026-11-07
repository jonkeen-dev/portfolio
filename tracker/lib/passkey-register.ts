import { startRegistration, WebAuthnError, type RegistrationResponseJSON } from "@simplewebauthn/browser";

import { authClient } from "@/lib/auth-client";
import { mapPasskeyRegistrationFailure, type PasskeyRegistrationFailure } from "@/lib/passkey-errors";

type AuthError = { code?: unknown; status?: unknown } | null;

type AuthResult<T> = {
  data: T | null;
  error: AuthError;
};

export type PasskeyRegistrationResult =
  | { ok: true }
  | { ok: false; failure: PasskeyRegistrationFailure };

function failureFrom(stage: PasskeyRegistrationFailure["stage"], error: AuthError, causeName?: unknown): PasskeyRegistrationFailure {
  return mapPasskeyRegistrationFailure({
    stage,
    code: error?.code,
    status: error?.status,
    causeName,
  });
}

function ceremonyFailure(error: unknown): PasskeyRegistrationFailure {
  if (error instanceof WebAuthnError) {
    const causeName = error.cause instanceof Error ? error.cause.name : error.name;
    return mapPasskeyRegistrationFailure({
      stage: "ceremony",
      code: error.code,
      status: 400,
      causeName,
    });
  }
  if (typeof DOMException !== "undefined" && error instanceof DOMException) {
    return mapPasskeyRegistrationFailure({
      stage: "ceremony",
      code: error.name,
      status: 400,
      causeName: error.name,
    });
  }
  return mapPasskeyRegistrationFailure({
    stage: "ceremony",
    code: "UNKNOWN_ERROR",
    status: 500,
  });
}

/**
 * Register a passkey through Better Auth.
 * Options, challenges, and credential bodies stay in memory for the ceremony and are never logged.
 */
export async function registerPasskey(name: string): Promise<PasskeyRegistrationResult> {
  const options = (await authClient.$fetch("/passkey/generate-register-options", {
    method: "GET",
    query: { name },
    throw: false,
  })) as AuthResult<Parameters<typeof startRegistration>[0]["optionsJSON"]>;

  if (!options.data) return { ok: false, failure: failureFrom("options", options.error) };

  let credential: RegistrationResponseJSON;
  try {
    credential = await startRegistration({ optionsJSON: options.data });
  } catch (error) {
    return { ok: false, failure: ceremonyFailure(error) };
  }

  const { clientExtensionResults, ...responseBody } = credential;
  void clientExtensionResults;
  const verified = (await authClient.$fetch("/passkey/verify-registration", {
    method: "POST",
    body: { response: responseBody, name },
    throw: false,
  })) as AuthResult<unknown>;

  if (!verified.data) return { ok: false, failure: failureFrom("verify", verified.error) };
  return { ok: true };
}

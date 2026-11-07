/**
 * Passkey registration failures, mapped for people and for logs.
 * Better Auth keeps its default freshAge (24 hours from session.createdAt).
 * Do not raise that window or set it to 0.
 */

export const PASSKEY_SESSION_FRESH_MS = 24 * 60 * 60 * 1000;

export const PASSKEY_STALE_SESSION_MESSAGE = "For security, sign in again before adding a passkey.";

export const PASSKEY_STALE_LINK_SENT_MESSAGE =
  "Check your email for a sign-in link. It brings you back here so you can add a passkey. It works for 10 minutes.";

export const PASSKEY_STALE_LINK_WAIT_MESSAGE = "A sign-in link was just sent. Wait a minute, then try again.";

export const PASSKEY_STALE_LINK_FAILED_MESSAGE =
  "The sign-in link could not be sent. You can try again in a moment, and the email link you already use still works.";

export const PASSKEY_CANCELLED_MESSAGE =
  "That was cancelled or it timed out. You can try again whenever you're ready. The email link still works.";

export const PASSKEY_NO_PROVIDER_MESSAGE =
  "This device doesn't have a place to keep a passkey right now. A security key or another device can hold it, and the email link still works.";

export const PASSKEY_EXISTS_MESSAGE =
  "That passkey is already saved on your account. You can sign in with it, and the email link still works.";

export const PASSKEY_ORIGIN_MESSAGE =
  "This page isn't allowed to save a passkey. Open the site the way you usually do, or keep using the email link.";

export const PASSKEY_SERVER_MESSAGE =
  "Something went wrong on our side, so the passkey was not saved. You can try again, or keep using the email link.";

export const PASSKEY_SAVED_MESSAGE = "Passkey saved on this device.";

export type PasskeyRegistrationStage = "options" | "ceremony" | "verify";

export type PasskeyRegistrationFailure = {
  stage: PasskeyRegistrationStage;
  status: number;
  code: string;
  causeName: string | null;
  guidance: string;
  needsFreshSession: boolean;
};

const UPPER_CODE = /^[A-Z][A-Z0-9_]{0,80}$/;
const DOM_ERROR = /^[A-Z][A-Za-z]{0,40}Error$/;

const STALE_CODES = new Set(["SESSION_NOT_FRESH", "SESSION_IS_NOT_FRESH"]);

const CANCEL_CODES = new Set([
  "ERROR_CEREMONY_ABORTED",
  "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
  "REGISTRATION_CANCELLED",
  "AUTH_CANCELLED",
]);

const CANCEL_CAUSES = new Set(["NotAllowedError", "AbortError", "TimeoutError"]);

const NO_PROVIDER_CODES = new Set([
  "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
  "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
  "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
  "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
]);

const NO_PROVIDER_CAUSES = new Set(["NotSupportedError", "ConstraintError"]);

const EXISTS_CODES = new Set(["ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED", "PREVIOUSLY_REGISTERED"]);

const EXISTS_CAUSES = new Set(["InvalidStateError"]);

const ORIGIN_CODES = new Set(["ERROR_INVALID_DOMAIN", "ERROR_INVALID_RP_ID", "INVALID_ORIGIN"]);

const ORIGIN_CAUSES = new Set(["SecurityError"]);

const SERVER_CODES = new Set([
  "FAILED_TO_VERIFY_REGISTRATION",
  "CHALLENGE_NOT_FOUND",
  "USER_NOT_FOUND",
  "UNABLE_TO_CREATE_SESSION",
  "UNKNOWN_ERROR",
  "ERROR_AUTHENTICATOR_GENERAL_ERROR",
  "ERROR_MALFORMED_PUBKEYCREDPARAMS",
  "ERROR_INVALID_USER_ID_LENGTH",
  "INTERNAL_SERVER_ERROR",
]);

export function safePasskeyCode(value: unknown): string {
  if (typeof value !== "string") return "UNKNOWN";
  const code = value.trim();
  if (DOM_ERROR.test(code)) return code;
  if (!UPPER_CODE.test(code)) return "UNKNOWN";
  if (!code.includes("_") && code.length > 32) return "UNKNOWN";
  return code;
}

export function safePasskeyStatus(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return 0;
  if (value < 100 || value > 599) return 0;
  return value;
}

export function sessionCreatedAtIsFresh(
  createdAt: Date | string | number | null | undefined,
  now = Date.now(),
): boolean {
  const time =
    createdAt instanceof Date
      ? createdAt.getTime()
      : typeof createdAt === "number"
        ? createdAt
        : typeof createdAt === "string"
          ? Date.parse(createdAt)
          : Number.NaN;
  if (!Number.isFinite(time)) return false;
  return now - time < PASSKEY_SESSION_FRESH_MS;
}

export function registrationStageForPath(pathname: string): PasskeyRegistrationStage | null {
  const path = pathname.replace(/\/+$/, "");
  if (path.endsWith("/passkey/generate-register-options")) return "options";
  if (path.endsWith("/passkey/verify-registration")) return "verify";
  return null;
}

export function passkeyFailureRecord(input: {
  stage: PasskeyRegistrationStage;
  status: number;
  code: string;
}): { event: "passkey_registration_failed"; stage: PasskeyRegistrationStage; status: number; code: string } {
  return {
    event: "passkey_registration_failed",
    stage: input.stage,
    status: safePasskeyStatus(input.status),
    code: safePasskeyCode(input.code),
  };
}

export function logPasskeyFailure(input: { stage: PasskeyRegistrationStage; status: number; code: string }): void {
  console.info(JSON.stringify(passkeyFailureRecord(input)));
}

export async function observePasskeyRegistrationResponse(request: Request, response: Response): Promise<Response> {
  const stage = registrationStageForPath(new URL(request.url).pathname);
  if (stage && response.status >= 400) {
    const code = await passkeyCodeFromResponse(response.clone());
    logPasskeyFailure({ stage, status: response.status, code });
  }
  return response;
}

export async function passkeyCodeFromResponse(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") return "UNKNOWN";
    return safePasskeyCode((body as { code?: unknown }).code);
  } catch {
    return "UNKNOWN";
  }
}

function causeOrNull(value: unknown): string | null {
  const cause = safePasskeyCode(value);
  if (cause === "UNKNOWN") return null;
  if (!DOM_ERROR.test(cause)) return null;
  return cause;
}

export function mapPasskeyRegistrationFailure(input: {
  stage: PasskeyRegistrationStage;
  code: unknown;
  status: unknown;
  causeName?: unknown;
}): PasskeyRegistrationFailure {
  const code = safePasskeyCode(input.code);
  const status = safePasskeyStatus(input.status);
  const causeName = causeOrNull(input.causeName);
  const needsFreshSession = STALE_CODES.has(code);
  return {
    stage: input.stage,
    status,
    code,
    causeName,
    needsFreshSession,
    guidance: guidanceFor(code, status, causeName),
  };
}

function guidanceFor(code: string, status: number, causeName: string | null): string {
  if (STALE_CODES.has(code)) return PASSKEY_STALE_SESSION_MESSAGE;
  if (causeName && ORIGIN_CAUSES.has(causeName)) return PASSKEY_ORIGIN_MESSAGE;
  if (causeName && EXISTS_CAUSES.has(causeName)) return PASSKEY_EXISTS_MESSAGE;
  if (causeName && NO_PROVIDER_CAUSES.has(causeName)) return PASSKEY_NO_PROVIDER_MESSAGE;
  if (causeName && CANCEL_CAUSES.has(causeName)) return PASSKEY_CANCELLED_MESSAGE;
  if (ORIGIN_CODES.has(code)) return PASSKEY_ORIGIN_MESSAGE;
  if (EXISTS_CODES.has(code)) return PASSKEY_EXISTS_MESSAGE;
  if (NO_PROVIDER_CODES.has(code)) return PASSKEY_NO_PROVIDER_MESSAGE;
  if (CANCEL_CODES.has(code)) return PASSKEY_CANCELLED_MESSAGE;
  if (status >= 500 || SERVER_CODES.has(code)) return PASSKEY_SERVER_MESSAGE;
  return "Passkey was not saved. You can try again, or keep using the email link.";
}

export function passkeyCodeLabel(code: string, causeName: string | null, status: number): string {
  const parts = [safePasskeyCode(code)];
  if (causeName && causeName !== parts[0]) parts.push(causeName);
  if (status) parts.push(String(status));
  return parts.join(" · ");
}

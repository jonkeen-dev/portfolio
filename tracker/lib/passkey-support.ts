/**
 * Passkey availability is decided only from WebAuthn features.
 * A user agent is accepted so callers can prove it is never a gate.
 */

export const PASSKEY_SECURITY_COPY =
  "A passkey signs you in on this device without a password. A security key or another device can hold it too. The email link always works.";

export const PASSKEY_UNAVAILABLE_MESSAGE = "Passkeys aren't available here. The email link still works.";

export const PASSKEY_SAVE_FAILED_MESSAGE = "Passkey was not saved. You can try again, or keep using the email link.";

export const PASSKEY_SAVE_FAILED_OPEN_MESSAGE =
  "Passkey was not saved. A security key or another device can hold it, and the email link still works.";

export const PASSKEY_SIGN_IN_FAILED_MESSAGE = "That didn't work. Try the email link instead.";

/** Leave attachment unset so platform, cross-device, security-key, and password-manager authenticators can all be used. */
export const PASSKEY_AUTHENTICATOR_SELECTION = {
  residentKey: "preferred",
  userVerification: "preferred",
} as const;

export type PasskeySignals = {
  hasPublicKeyCredential: boolean;
  platformAuthenticatorAvailable: boolean | null;
  conditionalMediationAvailable: boolean | null;
  clientCapabilities: Record<string, boolean> | null;
  userAgent?: string | null;
};

export type PasskeySupport = {
  offer: boolean;
  platformAuthenticator: boolean;
  conditionalMediation: boolean;
  hybrid: boolean | null;
  authenticatorSelection: typeof PASSKEY_AUTHENTICATOR_SELECTION;
  unavailableMessage: string | null;
  registrationFailureMessage: string;
  signInFailureMessage: string;
};

type PublicKeyCredentialApi = {
  isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
  isConditionalMediationAvailable?: () => Promise<boolean>;
  getClientCapabilities?: () => Promise<Record<string, boolean>>;
};

export type PasskeyHost = {
  PublicKeyCredential?: PublicKeyCredentialApi;
  userAgent?: string | null;
};

function capabilityFlag(capabilities: Record<string, boolean> | null, name: string): boolean | null {
  if (!capabilities || typeof capabilities[name] !== "boolean") return null;
  return capabilities[name];
}

export function passkeySupport(signals: PasskeySignals): PasskeySupport {
  const offer = signals.hasPublicKeyCredential;
  const platformKnownMissing = signals.platformAuthenticatorAvailable === false;
  return {
    offer,
    platformAuthenticator: signals.platformAuthenticatorAvailable === true,
    conditionalMediation: signals.conditionalMediationAvailable === true,
    hybrid: capabilityFlag(signals.clientCapabilities, "hybridTransport"),
    authenticatorSelection: PASSKEY_AUTHENTICATOR_SELECTION,
    unavailableMessage: offer ? null : PASSKEY_UNAVAILABLE_MESSAGE,
    registrationFailureMessage: platformKnownMissing ? PASSKEY_SAVE_FAILED_OPEN_MESSAGE : PASSKEY_SAVE_FAILED_MESSAGE,
    signInFailureMessage: PASSKEY_SIGN_IN_FAILED_MESSAGE,
  };
}

async function optionalBoolean(call: (() => Promise<boolean>) | undefined): Promise<boolean | null> {
  if (typeof call !== "function") return null;
  try {
    const value = await call();
    return typeof value === "boolean" ? value : null;
  } catch {
    return null;
  }
}

async function optionalCapabilities(
  call: (() => Promise<Record<string, boolean>>) | undefined,
): Promise<Record<string, boolean> | null> {
  if (typeof call !== "function") return null;
  try {
    const value = await call();
    if (!value || typeof value !== "object") return null;
    return value;
  } catch {
    return null;
  }
}

export async function readPasskeySignals(host: PasskeyHost): Promise<PasskeySignals> {
  const api = host.PublicKeyCredential;
  if (!api) {
    return {
      hasPublicKeyCredential: false,
      platformAuthenticatorAvailable: null,
      conditionalMediationAvailable: null,
      clientCapabilities: null,
      userAgent: host.userAgent ?? null,
    };
  }
  const [platformAuthenticatorAvailable, conditionalMediationAvailable, clientCapabilities] = await Promise.all([
    optionalBoolean(api.isUserVerifyingPlatformAuthenticatorAvailable?.bind(api)),
    optionalBoolean(api.isConditionalMediationAvailable?.bind(api)),
    optionalCapabilities(api.getClientCapabilities?.bind(api)),
  ]);
  return {
    hasPublicKeyCredential: true,
    platformAuthenticatorAvailable,
    conditionalMediationAvailable,
    clientCapabilities,
    userAgent: host.userAgent ?? null,
  };
}

export function browserPasskeyHost(): PasskeyHost {
  if (typeof window === "undefined") return {};
  const credential = window.PublicKeyCredential;
  return {
    userAgent: navigator.userAgent,
    PublicKeyCredential: typeof credential === "function" ? credential : undefined,
  };
}

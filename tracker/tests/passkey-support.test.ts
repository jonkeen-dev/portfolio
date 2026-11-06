import { describe, expect, it } from "vitest";

import {
  PASSKEY_AUTHENTICATOR_SELECTION,
  PASSKEY_SAVE_FAILED_MESSAGE,
  PASSKEY_SAVE_FAILED_OPEN_MESSAGE,
  PASSKEY_SECURITY_COPY,
  PASSKEY_SIGN_IN_FAILED_MESSAGE,
  PASSKEY_UNAVAILABLE_MESSAGE,
  passkeySupport,
  readPasskeySignals,
  type PasskeySignals,
} from "../lib/passkey-support";

const FIREFOX_ANDROID = "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

const BROWSER_NAME = /\b(chrome|firefox|safari|edge|samsung)\b/i;

const missingCapabilities: PasskeySignals = {
  hasPublicKeyCredential: true,
  platformAuthenticatorAvailable: false,
  conditionalMediationAvailable: false,
  clientCapabilities: {
    conditionalCreate: false,
    conditionalGet: false,
    hybridTransport: false,
    passkeyPlatformAuthenticator: false,
    userVerifyingPlatformAuthenticator: false,
  },
};

describe("passkey support", () => {
  it("offers a passkey in Firefox when WebAuthn exists, even if extra capabilities are missing", () => {
    const firefox = passkeySupport({ ...missingCapabilities, userAgent: FIREFOX_ANDROID });
    const chrome = passkeySupport({ ...missingCapabilities, userAgent: CHROME_ANDROID });
    expect(firefox).toEqual(chrome);
    expect(firefox.offer).toBe(true);
    expect(firefox.unavailableMessage).toBeNull();
    expect(firefox.platformAuthenticator).toBe(false);
    expect(firefox.conditionalMediation).toBe(false);
    expect(firefox.hybrid).toBe(false);
    expect(firefox.authenticatorSelection).toEqual(PASSKEY_AUTHENTICATOR_SELECTION);
    expect(firefox.authenticatorSelection).not.toHaveProperty("authenticatorAttachment");
    expect(firefox.authenticatorSelection.residentKey).toBe("preferred");
    expect(firefox.authenticatorSelection.userVerification).toBe("preferred");
    expect(firefox.registrationFailureMessage).toBe(PASSKEY_SAVE_FAILED_OPEN_MESSAGE);
  });

  it("hides passkeys only when PublicKeyCredential is missing, including on Chrome", () => {
    const support = passkeySupport({
      hasPublicKeyCredential: false,
      platformAuthenticatorAvailable: true,
      conditionalMediationAvailable: true,
      clientCapabilities: { hybridTransport: true, passkeyPlatformAuthenticator: true },
      userAgent: CHROME_ANDROID,
    });
    expect(support.offer).toBe(false);
    expect(support.unavailableMessage).toBe(PASSKEY_UNAVAILABLE_MESSAGE);
  });

  it("does not require conditional mediation or client capabilities", () => {
    const support = passkeySupport({
      hasPublicKeyCredential: true,
      platformAuthenticatorAvailable: null,
      conditionalMediationAvailable: null,
      clientCapabilities: null,
      userAgent: FIREFOX_ANDROID,
    });
    expect(support.offer).toBe(true);
    expect(support.registrationFailureMessage).toBe(PASSKEY_SAVE_FAILED_MESSAGE);
    expect(support.signInFailureMessage).toBe(PASSKEY_SIGN_IN_FAILED_MESSAGE);
  });

  it("keeps the security and failure copy free of browser names", () => {
    for (const text of [
      PASSKEY_SECURITY_COPY,
      PASSKEY_UNAVAILABLE_MESSAGE,
      PASSKEY_SAVE_FAILED_MESSAGE,
      PASSKEY_SAVE_FAILED_OPEN_MESSAGE,
      PASSKEY_SIGN_IN_FAILED_MESSAGE,
    ]) {
      expect(text).not.toMatch(BROWSER_NAME);
    }
  });

  it("still offers a passkey when capability checks fail or are absent", async () => {
    const signals = await readPasskeySignals({
      userAgent: FIREFOX_ANDROID,
      PublicKeyCredential: {
        isUserVerifyingPlatformAuthenticatorAvailable: () => Promise.reject(new Error("no platform")),
        isConditionalMediationAvailable: () => Promise.resolve(false),
        getClientCapabilities: () => Promise.reject(new Error("unsupported")),
      },
    });
    expect(signals.userAgent).toBe(FIREFOX_ANDROID);
    expect(signals.hasPublicKeyCredential).toBe(true);
    expect(signals.platformAuthenticatorAvailable).toBeNull();
    expect(signals.conditionalMediationAvailable).toBe(false);
    expect(signals.clientCapabilities).toBeNull();
    expect(passkeySupport(signals).offer).toBe(true);
  });

  it("does not invent WebAuthn support when the constructor is missing", async () => {
    const signals = await readPasskeySignals({ userAgent: FIREFOX_ANDROID });
    expect(signals.hasPublicKeyCredential).toBe(false);
    expect(passkeySupport(signals).offer).toBe(false);
    expect(passkeySupport(signals).unavailableMessage).toBe(PASSKEY_UNAVAILABLE_MESSAGE);
  });
});

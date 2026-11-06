import { expect, test } from "@playwright/test";

const FIREFOX_ANDROID = "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0";

test("offers a passkey to Firefox when WebAuthn exists", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ userAgent: FIREFOX_ANDROID });
  await context.addInitScript(() => {
    type CredentialApi = {
      isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
      isConditionalMediationAvailable?: () => Promise<boolean>;
      getClientCapabilities?: () => Promise<Record<string, boolean>>;
    };
    const install = (credential: CredentialApi) => {
      credential.isUserVerifyingPlatformAuthenticatorAvailable = () => Promise.resolve(false);
      credential.isConditionalMediationAvailable = () => Promise.resolve(false);
      credential.getClientCapabilities = () =>
        Promise.resolve({
          conditionalCreate: false,
          conditionalGet: false,
          hybridTransport: false,
          passkeyPlatformAuthenticator: false,
          userVerifyingPlatformAuthenticator: false,
        });
    };
    if (typeof window.PublicKeyCredential === "function") {
      install(window.PublicKeyCredential as unknown as CredentialApi);
      return;
    }
    function FallbackPublicKeyCredential() {
      /* Stand-in so the page can see a WebAuthn constructor. */
    }
    install(FallbackPublicKeyCredential as unknown as CredentialApi);
    Object.defineProperty(window, "PublicKeyCredential", {
      configurable: true,
      writable: true,
      value: FallbackPublicKeyCredential,
    });
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(`${baseURL}/sign-in`);
  await expect(page.getByRole("button", { name: "Email me a sign-in link" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in with a passkey" })).toBeVisible();
  await expect(page.getByText(/chrome|firefox|safari|isn't supported|not supported/i)).toHaveCount(0);
  await page.screenshot({ path: "/opt/cursor/artifacts/passkey-firefox-sign-in.png", fullPage: true });
  await context.close();
});

test("keeps the email link when WebAuthn is missing", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ userAgent: FIREFOX_ANDROID });
  await context.addInitScript(() => {
    Object.defineProperty(window, "PublicKeyCredential", { configurable: true, writable: true, value: undefined });
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto(`${baseURL}/sign-in`);
  await expect(page.getByRole("button", { name: "Sign in with a passkey" })).toHaveCount(0);
  await expect(page.getByText("Passkeys aren't available here. The email link still works.")).toBeVisible();
  await page.getByLabel("Email").fill("stranger@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(
    page.getByText("Check your email. If this address has access, there's a sign-in link waiting. It works for 10 minutes."),
  ).toBeVisible();
  await expect(page.getByText(/chrome|firefox|safari/i)).toHaveCount(0);
  await page.screenshot({ path: "/opt/cursor/artifacts/passkey-unavailable-sign-in.png", fullPage: true });
  await context.close();
});

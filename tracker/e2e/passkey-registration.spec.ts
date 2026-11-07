import { mkdirSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

mkdirSync("/opt/cursor/artifacts", { recursive: true });

const ORIGIN = "http://localhost:3100";
const OWNER = "owner@example.com";

// The service worker forwards fetch, which hides page.route from the registration request.
test.use({ serviceWorkers: "block" });

async function layoutProblems() {
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const hits: string[] = [];
  if (overflow > 1) hits.push(`page overflow ${overflow}px`);

  function shown(el: Element) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    if (el.closest("[hidden]")) return false;
    const rect = el.getBoundingClientRect();
    return rect.width >= 1 && rect.height >= 1 && rect.bottom > 0 && rect.right > 0;
  }

  function label(el: Element) {
    return (el.getAttribute("aria-label") || el.textContent || el.tagName).replace(/\s+/g, " ").trim().slice(0, 70);
  }

  function overlap(a: DOMRect, b: DOMRect) {
    const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return ix > 4 && iy > 4;
  }

  const items = [...document.querySelectorAll("a, button, input")].filter(shown);
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (!a || !b || a.contains(b) || b.contains(a)) continue;
      if (!overlap(a.getBoundingClientRect(), b.getBoundingClientRect())) continue;
      hits.push(`${label(a)} ∩ ${label(b)}`);
      if (hits.length > 8) return hits;
    }
  }

  const root = document.querySelector("main");
  if (!root) return hits;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node.textContent ?? "";
    const re = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text))) {
      const word = match[0];
      if (word.length < 8) continue;
      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + word.length);
      const rects = [...range.getClientRects()].filter((rect) => rect.width > 1 && rect.height > 1);
      const tops = new Set(rects.map((rect) => Math.round(rect.top)));
      if (tops.size > 1) hits.push(`mid-word ${word.slice(0, 40)}`);
    }
    node = walker.nextNode();
  }
  return hits;
}

async function expectFits(page: Page, name: string) {
  for (const width of [320, 360, 412]) {
    await page.setViewportSize({ width, height: 915 });
    const hits = await page.evaluate(layoutProblems);
    expect(hits, `${name} at ${width}px\n${hits.join("\n")}`).toEqual([]);
    await page.screenshot({
      path: `/opt/cursor/artifacts/passkey-security-${name}-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 412, height: 915 });
}

async function latestLink(request: Page["request"], previous: number) {
  const response = await request.get("/api/dev/mailbox");
  const body = (await response.json()) as { messages: Array<{ to: string; url: string | null }> };
  const messages = body.messages.filter((message) => message.to === OWNER && message.url);
  return messages.length > previous ? (messages.at(-1)?.url ?? "") : "";
}

async function signIn(page: Page) {
  await page.goto("/sign-in");
  const before = await page.request.get("/api/dev/mailbox");
  const beforeBody = (await before.json()) as { messages: Array<{ to: string; url: string | null }> };
  const previous = beforeBody.messages.filter((message) => message.to === OWNER && message.url).length;
  await page.getByLabel("Email").fill(OWNER);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  let link = "";
  await expect.poll(async () => {
    link = await latestLink(page.request, previous);
    return link;
  }).not.toBe("");
  await page.goto(link);
  await page.waitForURL(/\/(setup|today|settings)/);
  if (page.url().includes("/setup")) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByLabel("Start date").fill("2026-10-12");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Go to Today" }).click();
    await page.waitForURL(/\/today/);
  }
}

async function addVirtualAuthenticator(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable");
  await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

test("a stale session asks for a new sign-in link, then a passkey can be saved", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings/security");
  await expect(page.getByRole("heading", { name: "Security" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a passkey" })).toBeVisible();

  const aged = await page.request.post("/api/dev/age-session", { headers: { origin: ORIGIN } });
  expect(aged.ok()).toBeTruthy();
  const denied = await page.request.get("/api/auth/passkey/generate-register-options", { headers: { origin: ORIGIN } });
  expect(denied.status()).toBe(403);
  const deniedBody = (await denied.json()) as { code?: string };
  expect(deniedBody.code).toBe("SESSION_NOT_FRESH");
  await page.reload();
  await expect(page.getByText("For security, sign in again before adding a passkey.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a passkey" })).toHaveCount(0);
  await expect(page.getByText(/Passkey was not saved/)).toHaveCount(0);
  await expect(page.getByText(/chrome|firefox|safari|edge|samsung/i)).toHaveCount(0);
  await expectFits(page, "stale");

  const before = await page.request.get("/api/dev/mailbox");
  const beforeBody = (await before.json()) as { messages: Array<{ to: string; url: string | null }> };
  const previous = beforeBody.messages.filter((message) => message.to === OWNER && message.url).length;
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(
    page.getByText("Check your email for a sign-in link. It brings you back here so you can add a passkey."),
  ).toBeVisible();
  let link = "";
  await expect.poll(async () => {
    link = await latestLink(page.request, previous);
    return link;
  }).toContain("callbackURL");
  expect(link).toContain("settings%2Fsecurity");
  expect(link).not.toContain(OWNER);
  await page.goto(link);
  await page.waitForURL(/\/settings\/security/);
  await expect(page.getByRole("button", { name: "Add a passkey" })).toBeVisible();
  await expect(page.getByText("For security, sign in again before adding a passkey.")).toHaveCount(0);

  const optionsPath = (url: URL) => url.pathname.includes("generate-register-options");
  await page.route(optionsPath, async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        code: "FAILED_TO_VERIFY_REGISTRATION",
        message: "owner@example.com dGhpcyBpcyBhIGNoYWxsZW5nZQ",
        challenge: "dGhpcyBpcyBhIGNoYWxsZW5nZQ",
      }),
    });
  });
  await page.getByRole("button", { name: "Add a passkey" }).click();
  await expect(page.getByText("Something went wrong on our side, so the passkey was not saved.")).toBeVisible();
  await expect(page.getByText("FAILED_TO_VERIFY_REGISTRATION")).toBeVisible();
  await expect(page.getByText("· 500")).toBeVisible();
  await expect(page.getByText(/@/)).toHaveCount(0);
  await expect(page.getByText("dGhpcyBpcyBhIGNoYWxsZW5nZQ")).toHaveCount(0);
  await expectFits(page, "server-error");
  await page.unroute(optionsPath);

  await addVirtualAuthenticator(page);
  await page.getByRole("button", { name: "Add a passkey" }).click();
  await expect(page.getByText("Passkey saved on this device.")).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/passkey-security-saved.png", fullPage: true });

  const ceremonyLog = page.waitForResponse((response) => response.url().includes("/api/passkey-log"));
  await page.getByRole("button", { name: "Add a passkey" }).click();
  expect((await ceremonyLog).status()).toBe(204);
  await expect(page.getByText("That passkey is already saved on your account.")).toBeVisible();
  await expect(page.getByText("ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED")).toBeVisible();
  await expect(page.getByText(/chrome|firefox|safari|edge|samsung/i)).toHaveCount(0);
  await expectFits(page, "exists");
});

test.afterEach(async ({ page }) => {
  const response = await page.request.post("/api/dev/reset-account", { headers: { origin: ORIGIN } });
  expect([200, 401]).toContain(response.status());
});

import { mkdirSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

mkdirSync("/opt/cursor/artifacts", { recursive: true });

async function layoutProblems() {
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  const nav = document.querySelector(".nav");
  const navOverflow = nav ? nav.scrollWidth - nav.clientWidth : 0;

  function shown(el: Element) {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    if (el.closest("[hidden]")) return false;
    if (el.closest("details:not([open])")) return false;
    const rect = el.getBoundingClientRect();
    return rect.width >= 1 && rect.height >= 1 && rect.bottom > 0 && rect.right > 0;
  }

  function label(el: Element) {
    return (el.getAttribute("aria-label") || el.textContent || el.tagName).replace(/\s+/g, " ").trim().slice(0, 70);
  }

  function fixedAncestor(el: Element) {
    let node: Element | null = el;
    while (node && node !== document.documentElement) {
      const pos = getComputedStyle(node).position;
      if (pos === "fixed" || pos === "sticky") return node;
      node = node.parentElement;
    }
    return null;
  }

  function overlap(a: DOMRect, b: DOMRect) {
    const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return ix > 4 && iy > 4;
  }

  const items = [...document.querySelectorAll('a, button, input, select, textarea, summary, [role="button"], [role="radio"], [role="checkbox"]')].filter(shown);
  const hits: string[] = [];
  if (overflow > 1) hits.push(`page overflow ${overflow}px`);
  if (navOverflow > 1) hits.push(`nav overflow ${navOverflow}px`);

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (!a || !b || a.contains(b) || b.contains(a)) continue;
      if (a.closest("[role='dialog']") !== b.closest("[role='dialog']")) continue;
      const before = window.scrollY;
      let ra = a.getBoundingClientRect();
      let rb = b.getBoundingClientRect();
      if (!overlap(ra, rb)) continue;
      const fa = fixedAncestor(a);
      const fb = fixedAncestor(b);
      if (Boolean(fa) !== Boolean(fb)) {
        const flow = fa ? b : a;
        flow.scrollIntoView({ block: "center", inline: "nearest" });
        ra = a.getBoundingClientRect();
        rb = b.getBoundingClientRect();
        window.scrollTo(0, before);
        if (!overlap(ra, rb)) continue;
      }
      hits.push(`${label(a)} ∩ ${label(b)}`);
      if (hits.length > 8) return hits;
    }
  }
  return hits;
}

async function expectFits(page: Page, name: string) {
  for (const width of [320, 360, 412]) {
    await page.setViewportSize({ width, height: 915 });
    const hits = await page.evaluate(layoutProblems);
    expect(hits, `${name} at ${width}px\n${hits.join("\n")}`).toEqual([]);
  }
  await page.setViewportSize({ width: 412, height: 915 });
}

async function expectAccessible(page: Page, name: string) {
  for (const scheme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    const root = page.locator("html");
    if (scheme === "light") {
      await expect(root).toHaveClass(/\blight\b/);
      await expect(root).not.toHaveClass(/\bdark\b/);
    } else {
      await expect(root).toHaveClass(/\bdark\b/);
      await expect(root).not.toHaveClass(/\blight\b/);
    }
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
    expect(serious, `${name} ${scheme}\n${JSON.stringify(serious, null, 2)}`).toEqual([]);
  }
  await page.emulateMedia({ colorScheme: "dark" });
}

test("sign in, log a workout, level up, and publish a profile", async ({ page, request, browser }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Calisthenics Tracker" })).toBeVisible();
  await expectFits(page, "sign-in");
  await page.screenshot({ path: "/opt/cursor/artifacts/sign-in.png", fullPage: true });
  await expectAccessible(page, "sign-in");

  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(
    page.getByText(
      "Check your email. If this address has access, there's a sign-in link waiting. It works for 10 minutes.",
    ),
  ).toBeVisible();

  let link = "";
  await expect
    .poll(async () => {
      const response = await request.get("/api/dev/mailbox");
      const body = (await response.json()) as { messages: Array<{ to: string; url: string | null }> };
      link = body.messages.find((message) => message.to === "owner@example.com" && message.url)?.url ?? "";
      return link;
    })
    .not.toBe("");

  await page.goto(link);
  await page.waitForURL(/\/setup/);
  await expect(page.getByRole("heading", { name: "How this works" })).toBeVisible();
  await expectFits(page, "setup");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 412, height: 915 });
  await page.screenshot({ path: "/opt/cursor/artifacts/phase4-setup.png" });
  await expectAccessible(page, "setup");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByLabel("Name (optional)").fill("Jon");
  await page.getByLabel("Start date").fill("2026-10-12");
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText(/Your first session is Monday, Oct 12/)).toBeVisible();
  await page.getByRole("button", { name: "Go to Today" }).click();
  await page.waitForURL(/\/today/);

  const prior = await page.request.post("/api/dev/prior-session", {
    data: { date: "2026-10-23", exerciseId: "SQ1", sets: [12, 12] },
    headers: { origin: "http://127.0.0.1:3100" },
  });
  expect(prior.ok(), await prior.text()).toBeTruthy();

  await page.goto("/today?on=2026-10-26");
  await expect(page.getByRole("heading", { name: "Full body", exact: true })).toBeVisible();
  await expect(page.getByText("Week 3")).toBeVisible();
  await page.getByRole("button", { name: "How to" }).first().click();
  const howTo = page.getByRole("dialog");
  await expect(howTo).toBeVisible();
  await expect(howTo.getByRole("button", { name: /Play demo/ })).toBeVisible();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 412, height: 915 });
  await page.screenshot({ path: "/opt/cursor/artifacts/phase3-howto.png" });
  await expectAccessible(page, "how to");
  await page.getByRole("button", { name: "Close" }).click();
  await expect(howTo).toBeHidden();
  await expectFits(page, "today");
  await expectAccessible(page, "today");

  for (const setNumber of [1, 2, 3]) {
    await page.getByRole("button", { name: `Log set ${setNumber}` }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("spinbutton", { name: "Reps" })).toHaveValue("12");
    if (setNumber === 1) {
      await expectFits(page, "log sheet");
      await expectAccessible(page, "set dialog");
    }
    await dialog.getByRole("button", { name: "Save set" }).click();
    await expect(dialog).toBeHidden();
    if (setNumber < 3) {
      await expect(page.getByRole("timer")).toBeVisible();
      if (setNumber === 1) await expectFits(page, "rest bar");
      await page.getByRole("button", { name: "Skip" }).click();
    }
  }

  const timer = page.getByRole("timer");
  if (await timer.isVisible()) await page.getByRole("button", { name: "Skip" }).click();
  await page.screenshot({ path: "/opt/cursor/artifacts/today.png", fullPage: true });
  await page.getByRole("button", { name: "Finish session" }).click();
  await page.getByRole("button", { name: "Save and finish" }).click();
  await expect(page.getByText("Ready to level up")).toBeVisible();
  await expect(page.getByRole("button", { name: "Move up to Bodyweight Squat" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/level-up.png", fullPage: true });
  await page.getByRole("button", { name: "Move up to Bodyweight Squat" }).click();
  await expect(page.getByText("Bodyweight Squat").first()).toBeVisible();

  await page.goto("/ladders");
  await expect(page.getByRole("heading", { name: "Ladders" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Choose a level myself/ }).first()).toBeVisible();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 412, height: 915 });
  await page.screenshot({ path: "/opt/cursor/artifacts/phase3-ladders.png" });
  await page.getByRole("button", { name: "Choose a level myself" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Use this if the current level is too easy or too hard.")).toBeVisible();
  await expectFits(page, "choose level");
  await page.screenshot({ path: "/opt/cursor/artifacts/phase3-choose-level.png" });
  await expectAccessible(page, "choose level");
  await page.getByRole("button", { name: "Close" }).click();
  await expectFits(page, "ladders");
  await expectAccessible(page, "ladders");

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible();
  await expect(page.locator("dt").filter({ hasText: "Sessions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recent sessions" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/phase3-progress.png" });
  await page.getByRole("button", { name: /^Squat/ }).click();
  await expect(page.getByRole("button", { name: "Show as table" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/phase3-movement.png" });
  await page.getByRole("button", { name: "Show as table" }).click();
  await expect(page.getByRole("table", { name: /Squat top set/ })).toBeVisible();
  await expectFits(page, "progress");
  await expectAccessible(page, "progress");

  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
  await page.getByRole("radio", { name: "Squat" }).click();
  await expect(page.getByRole("button", { name: /Box Squat/ })).toBeVisible();
  await expect(page.getByText("Wall Push-Up")).toHaveCount(0);
  await page.getByLabel("Search exercises").fill("wall slide");
  await page.getByRole("radio", { name: "All" }).click();
  await expect(page.getByRole("button", { name: /Wall Slide/ })).toBeVisible();
  await expect(page.getByText("Box Squat")).toHaveCount(0);
  await page.screenshot({ path: "/opt/cursor/artifacts/phase3-library.png" });
  await expectFits(page, "library");
  await expectAccessible(page, "library");

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/phase4-settings.png" });
  await expectFits(page, "settings");
  await expectAccessible(page, "settings");
  for (const path of ["/settings/profile", "/settings/workout", "/settings/people", "/settings/security", "/settings/data", "/settings/appearance"]) {
    await page.goto(path);
    await expectFits(page, path);
  }
  await page.goto("/settings/appearance");
  await expect(page.getByRole("radio", { name: "Match this device" })).toBeChecked();
  await expect(page.getByText("Dark")).toBeVisible();
  await expectAccessible(page, "appearance");

  await page.goto("/today?on=2026-10-12");
  await expect(page.getByText("Test 1 of")).toBeVisible();
  await expectFits(page, "assessment");

  await page.goto("/settings/sharing");
  await page.getByRole("radio", { name: "Anyone with the link" }).check();
  await page.getByLabel("Handle").fill("owner");
  await page.getByRole("button", { name: "Save sharing" }).click();
  await expect(page.getByRole("heading", { name: "Sharing" })).toBeVisible();
  const copyLink = page.getByRole("button", { name: "Copy link" });
  await expect(copyLink).toBeVisible();
  await copyLink.scrollIntoViewIfNeeded();
  await expectFits(page, "sharing");
  await page.screenshot({ path: "/opt/cursor/artifacts/phase4-sharing.png" });
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(page.getByText("This is what others see.")).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/phase4-preview.png" });
  await expectAccessible(page, "sharing preview");
  await page.getByRole("button", { name: "Close" }).click();

  await page.goto("/u/owner");
  await expect(page.getByText("View only")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stats" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Set log" })).toHaveCount(0);
  await expect(page.getByText("owner@example.com")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Finish session" })).toHaveCount(0);
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /noindex/);
  await page.screenshot({ path: "/opt/cursor/artifacts/public-profile.png", fullPage: true });
  await expectFits(page, "public profile");
  await expectAccessible(page, "public profile");

  const missing = await request.get("/u/nobody-here");
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain("That page doesn't exist.");
  expect(missing.headers()["x-robots-tag"] ?? "").toContain("noindex");
  const published = await request.get("/u/owner");
  expect(published.status()).toBe(200);
  expect(published.headers()["x-robots-tag"] ?? "").toContain("noindex");
  expect(published.headers()["cache-control"] ?? "").toContain("no-store");

  const denied = await request.post("/api/sets", {
    data: { date: "2026-10-26" },
    headers: { origin: "http://127.0.0.1:3100" },
  });
  expect(denied.status()).toBe(401);

  await page.goto("/help");
  await expect(page.getByRole("heading", { name: "Help" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expectAccessible(page, "help");

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expectAccessible(page, "privacy");

  await page.goto("/partner");
  await expect(page.getByRole("heading", { name: "Partner" })).toBeVisible();
  await expectFits(page, "partner");
  await expectAccessible(page, "partner");

  await page.goto("/today?on=2026-10-21");
  await expect(page.getByRole("heading", { name: "Full body", exact: true })).toBeVisible();
  await expect(page.getByText("Day B")).toBeVisible();
  let guard = 0;
  while (guard < 16 && (await page.getByRole("button", { name: /^Log set / }).count()) > 0) {
    guard += 1;
    await page.getByRole("button", { name: /^Log set / }).first().click();
    const dialog = page.getByRole("dialog");
    if (guard === 1) await expectAccessible(page, "day b set dialog");
    const start = dialog.getByRole("button", { name: "Start" });
    if ((await start.count()) > 0) {
      await expectFits(page, "hold timer");
      await expectAccessible(page, "hold timer");
      await start.click();
      await dialog.getByRole("button", { name: "Stop" }).click();
      const saveLeft = dialog.getByRole("button", { name: "Save left side" });
      if ((await saveLeft.count()) > 0) {
        await saveLeft.click();
        await dialog.getByRole("button", { name: "Start" }).click();
        await dialog.getByRole("button", { name: "Stop" }).click();
      }
    }
    await dialog.getByRole("button", { name: "Save set" }).click();
    await expect(dialog).toBeHidden();
    const rest = page.getByRole("timer");
    if (await rest.isVisible()) {
      if (guard === 1) await expectAccessible(page, "rest bar");
      await page.getByRole("button", { name: "Skip" }).click();
      await expect(rest).toBeHidden();
    }
  }
  await page.getByRole("button", { name: "Finish session" }).click();
  await expectFits(page, "finish sheet");
  await expectAccessible(page, "finish sheet");
  await page.getByRole("button", { name: "Save and finish" }).click();
  await expect(page.getByText(/Done\. \d+ exercise/)).toBeVisible();

  await page.goto("/today?on=2026-10-22");
  await expect(page.getByRole("heading", { name: "Rest day" })).toBeVisible();
  await expect(page.getByText(/Next: Friday/)).toBeVisible();
  await expectFits(page, "rest day");
  await expectAccessible(page, "rest day");

  await page.goto("/settings/people");
  await page.getByLabel("Email").fill("partner@example.com");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByText("Invite sent to partner@example.com. It works for 72 hours.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy invite link" }).first()).toBeVisible();

  let inviteUrl = "";
  let inviteSubject = "";
  let inviteText = "";
  await expect
    .poll(async () => {
      const response = await request.get("/api/dev/mailbox");
      const body = (await response.json()) as {
        messages: Array<{ to: string; subject: string; text: string; url: string | null }>;
      };
      const message = body.messages.find((item) => item.to === "partner@example.com");
      inviteUrl = message?.url ?? "";
      inviteSubject = message?.subject ?? "";
      inviteText = message?.text ?? "";
      return inviteUrl;
    })
    .toContain("/magic-link/verify");
  expect(inviteSubject).toBe("Jon invited you to Calisthenics Tracker");
  expect(inviteText).toContain(inviteUrl);
  expect(inviteText).toContain("72 hours");

  const partnerContext = await browser.newContext();
  const partnerPage = await partnerContext.newPage();
  await partnerPage.setViewportSize({ width: 412, height: 915 });
  await partnerPage.goto(inviteUrl);
  await partnerPage.waitForURL(/\/setup/);
  await partnerPage.getByRole("button", { name: "Next" }).click();
  await partnerPage.getByLabel("Start date").fill("2026-10-12");
  await partnerPage.getByRole("button", { name: "Next" }).click();
  await partnerPage.getByRole("button", { name: "Go to Today" }).click();
  await partnerPage.waitForURL(/\/today/);
  await partnerPage.goto("/partner");
  await expect(partnerPage.getByRole("heading", { name: "owner", exact: true })).toBeVisible();
  await expect(partnerPage.getByText("View only")).toBeVisible();
  await expect(partnerPage.locator("dt").filter({ hasText: "Sessions" })).toBeVisible();
  await partnerPage.emulateMedia({ colorScheme: "dark" });
  await partnerPage.screenshot({ path: "/opt/cursor/artifacts/phase4-partner.png" });
  await expectAccessible(partnerPage, "partner joined");

  await partnerPage.goto("/settings/data");
  await partnerPage.getByRole("button", { name: "Delete account" }).click();
  const sheet = partnerPage.getByRole("dialog");
  await expect(sheet.getByRole("button", { name: "Delete account" })).toBeDisabled();
  await partnerPage.screenshot({ path: "/opt/cursor/artifacts/phase4-delete.png" });
  await expectFits(partnerPage, "delete sheet");
  await sheet.getByLabel("Type DELETE to confirm").fill("delete");
  await expect(sheet.getByRole("button", { name: "Delete account" })).toBeDisabled();
  await sheet.getByLabel("Type DELETE to confirm").fill("DELETE");
  await sheet.getByRole("button", { name: "Delete account" }).click();
  await expect(partnerPage.getByText("Your account and training log were deleted.")).toBeVisible();
  await partnerContext.close();

  await page.goto("/this-page-is-missing");
  await expect(page.getByRole("heading", { name: "That page doesn't exist." })).toBeVisible();
  await expectFits(page, "404");

  await page.context().clearCookies();
  await page.goto("/today");
  await expect(page).toHaveURL(/\/sign-in/);
});

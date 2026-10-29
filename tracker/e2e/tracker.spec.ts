import { mkdirSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

mkdirSync("/opt/cursor/artifacts", { recursive: true });

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

test("sign in, log a workout, level up, and publish a profile", async ({ page, request }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Calisthenics Tracker" })).toBeVisible();
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
  await expectAccessible(page, "setup");
  await page.getByLabel("Start date").fill("2026-10-12");
  await page.getByRole("button", { name: "Save setup" }).click();
  await page.waitForURL(/\/today/);

  const prior = await page.request.post("/api/dev/prior-session", {
    data: { date: "2026-10-23", exerciseId: "SQ1", sets: [12, 12] },
    headers: { origin: "http://127.0.0.1:3100" },
  });
  expect(prior.ok(), await prior.text()).toBeTruthy();

  await page.goto("/today?on=2026-10-26");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByText("Week 3")).toBeVisible();
  await expectAccessible(page, "today");

  for (const setNumber of [1, 2, 3]) {
    await page.getByRole("button", { name: `Box Squat, set ${setNumber}`, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("spinbutton", { name: "Reps" })).toHaveValue("12");
    if (setNumber === 1) await expectAccessible(page, "set dialog");
    await dialog.getByRole("button", { name: "Save set" }).click();
    await expect(dialog).toBeHidden();
  }

  await page.screenshot({ path: "/opt/cursor/artifacts/today.png", fullPage: true });
  await page.getByRole("button", { name: "Finish session" }).click();
  await expect(page.getByText("Ready to level up")).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept Bodyweight Squat" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/level-up.png", fullPage: true });
  await page.getByRole("button", { name: "Accept Bodyweight Squat" }).click();
  await expect(page.getByText("You're on Bodyweight Squat.")).toBeVisible();

  await page.goto("/ladders");
  await expect(page.getByRole("heading", { name: "Ladders" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/ladders.png", fullPage: true });
  await expectAccessible(page, "ladders");

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Progress" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/progress.png", fullPage: true });
  await expectAccessible(page, "progress");

  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/library.png", fullPage: true });
  await expectAccessible(page, "library");

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Match this device" })).toBeChecked();
  await expect(page.getByText("Dark")).toBeVisible();
  await page.screenshot({ path: "/opt/cursor/artifacts/settings.png", fullPage: true });
  await expectAccessible(page, "settings");

  await page.getByRole("radio", { name: "Public" }).check();
  await page.getByLabel("Handle").fill("owner");
  await page.getByRole("button", { name: "Save sharing" }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.goto("/u/owner");
  await expect(page.getByText("View only")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stats" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Set log" })).toHaveCount(0);
  await expect(page.getByText("owner@example.com")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Finish session" })).toHaveCount(0);
  const robots = page.locator('meta[name="robots"]');
  await expect(robots).toHaveAttribute("content", /noindex/);
  await page.screenshot({ path: "/opt/cursor/artifacts/public-profile.png", fullPage: true });
  await expectAccessible(page, "public profile");

  const missing = await request.get("/u/nobody-here");
  expect(missing.status()).toBe(200);
  expect(await missing.text()).toContain("This profile is not available.");
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
  await expectAccessible(page, "partner");

  await page.context().clearCookies();
  await page.goto("/today");
  await expect(page).toHaveURL(/\/sign-in/);
});

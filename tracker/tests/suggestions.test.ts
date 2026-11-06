import { PGlite } from "@electric-sql/pglite";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AppDatabase } from "../lib/db";
import { migrate } from "../lib/db/migrate";
import * as schema from "../lib/db/schema";
import { suggestions, user } from "../lib/db/schema";
import {
  SUGGESTION_ERRORS,
  SUGGESTION_MESSAGE_MAX,
  createSuggestion,
  listSuggestions,
  markSuggestionDone,
  notifySuggestion,
  parseSuggestion,
  prepareSubmission,
  suggestionNotice,
  suggestionsFrom,
  suggestionsNotifyEmail,
} from "../lib/suggestions";

const ownerId = "11111111-1111-4111-8111-111111111111";
const partnerId = "22222222-2222-4222-8222-222222222222";

let client: PGlite;
let db: AppDatabase;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  await migrate({
    db,
    kind: "pglite",
    exec: async (statement) => {
      await client.exec(statement);
    },
    close: async () => {
      await client.close();
    },
  });
  await db.insert(user).values([
    { id: ownerId, name: "Owner", email: "owner@example.com", emailVerified: true, role: "owner" },
    { id: partnerId, name: "Partner", email: "partner@example.com", emailVerified: true, role: "member" },
  ]);
});

afterAll(async () => {
  await client.close();
});

describe("suggestion validation", () => {
  it("accepts the three types and a trimmed message", () => {
    expect(parseSuggestion({ type: "Idea", message: "  Add a note  " })).toEqual({
      ok: true,
      type: "idea",
      message: "Add a note",
    });
    expect(parseSuggestion({ type: "nope", message: "Hello" }).ok).toBe(false);
    expect(parseSuggestion({ type: "feedback", message: "   " })).toEqual({ ok: false, error: SUGGESTION_ERRORS.empty });
    expect(parseSuggestion({ type: "improvement", message: "a".repeat(SUGGESTION_MESSAGE_MAX + 1) })).toEqual({
      ok: false,
      error: SUGGESTION_ERRORS.long,
    });
  });

  it("keeps markup as text", () => {
    const parsed = parseSuggestion({ type: "feedback", message: "<script>alert(1)</script>" });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.message).toBe("<script>alert(1)</script>");
  });

  it("refuses a signed-out or rate-limited submit before any row is written", async () => {
    expect(prepareSubmission({ userId: null, type: "idea", message: "Hello", rateOk: true }).ok).toBe(false);
    const denied = await createSuggestion(db, { userId: null, type: "idea", message: "Hello", rateOk: true });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toBe("signed-out");
    const limited = await createSuggestion(db, { userId: ownerId, type: "idea", message: "Hello", rateOk: false });
    expect(limited.ok).toBe(false);
    const rows = await db.select({ total: count() }).from(suggestions);
    expect(rows[0]?.total).toBe(0);
  });

  it("reads the notify address only when it is set and shaped like an email", () => {
    expect(suggestionsNotifyEmail(undefined)).toBeNull();
    expect(suggestionsNotifyEmail("  ")).toBeNull();
    expect(suggestionsNotifyEmail("not-an-email")).toBeNull();
    expect(suggestionsNotifyEmail("notify@example.com")).toBe("notify@example.com");
  });

  it("sends suggestion mail from the mail.jonkeen.dev domain", () => {
    expect(suggestionsFrom("Calisthenics Tracker <auth@jonkeen.dev>")).toBe(
      "Calisthenics Tracker <auth@mail.jonkeen.dev>",
    );
    expect(suggestionsFrom("Calisthenics Tracker <auth@mail.jonkeen.dev>")).toBe(
      "Calisthenics Tracker <auth@mail.jonkeen.dev>",
    );
    expect(suggestionsFrom("not an address")).toBeNull();
  });
});

describe("suggestion access", () => {
  it("lets the owner review newest first and hides the list from the partner", async () => {
    await db.insert(suggestions).values([
      {
        id: "33333333-3333-4333-8333-333333333333",
        userId: partnerId,
        type: "feedback",
        message: "Older note",
        status: "new",
        createdAt: new Date("2026-11-01T12:00:00.000Z"),
      },
      {
        id: "44444444-4444-4444-8444-444444444444",
        userId: ownerId,
        type: "idea",
        message: "<b>Newer</b>",
        status: "new",
        createdAt: new Date("2026-11-06T12:00:00.000Z"),
      },
    ]);
    expect(await listSuggestions(db, "member")).toBeNull();
    expect(await listSuggestions(db, null)).toBeNull();
    const rows = await listSuggestions(db, "owner");
    expect(rows?.map((row) => row.message)).toEqual(["<b>Newer</b>", "Older note"]);
    expect(await markSuggestionDone(db, "member", "44444444-4444-4444-8444-444444444444")).toBe(false);
    const [unchanged] = await db
      .select()
      .from(suggestions)
      .where(eq(suggestions.id, "44444444-4444-4444-8444-444444444444"));
    expect(unchanged?.status).toBe("new");
    expect(await markSuggestionDone(db, "owner", "44444444-4444-4444-8444-444444444444")).toBe(true);
    const [done] = await db.select().from(suggestions).where(eq(suggestions.id, "44444444-4444-4444-8444-444444444444"));
    expect(done?.status).toBe("done");
  });

  it("keeps the saved suggestion when the notice email fails", async () => {
    const saved = await createSuggestion(db, {
      userId: partnerId,
      type: "improvement",
      message: "Keep this even if mail fails",
      rateOk: true,
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    const notice = suggestionNotice({ type: saved.type, message: saved.message });
    expect(notice.text).not.toMatch(/@/);
    expect(notice.text).toContain("Keep this even if mail fails");
    const missed = await notifySuggestion(
      { id: saved.id, type: saved.type, message: saved.message, to: "notify@example.com", from: "App <auth@mail.jonkeen.dev>" },
      async () => {
        throw new Error("mailbox down");
      },
    );
    expect(missed.sent).toBe(false);
    const skipped = await notifySuggestion(
      { id: saved.id, type: saved.type, message: saved.message, to: null, from: null },
      async () => {
        throw new Error("should not send");
      },
    );
    expect(skipped.sent).toBe(false);
    const [row] = await db.select().from(suggestions).where(eq(suggestions.id, saved.id));
    expect(row?.message).toBe("Keep this even if mail fails");
    expect(row?.status).toBe("new");
  });
});

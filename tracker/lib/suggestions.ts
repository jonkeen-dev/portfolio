import { desc, eq } from "drizzle-orm";

import type { AppDatabase } from "@/lib/db";
import { suggestions } from "@/lib/db/schema";
import { sendAppEmail } from "@/lib/email";

export const SUGGESTION_TYPES = ["feedback", "idea", "improvement"] as const;
export const SUGGESTION_MESSAGE_MAX = 2000;

export const SUGGESTION_ERRORS = {
  type: "Choose feedback, an idea, or an improvement.",
  empty: "Write a message before sending.",
  long: "Keep the message under 2,000 characters.",
  rate: "Please wait a bit before sending another suggestion.",
} as const;

export const SUGGESTION_SAVED = "Thanks. Your suggestion was saved.";

export const SUGGESTION_LABELS = {
  feedback: "Feedback",
  idea: "Idea",
  improvement: "Improvement",
} as const;

export type SuggestionType = (typeof SUGGESTION_TYPES)[number];
export type SuggestionRole = "owner" | "member";

const MAIL_DOMAIN = "mail.jonkeen.dev";

export function suggestionsNotifyEmail(raw = process.env.SUGGESTIONS_NOTIFY_EMAIL): string | null {
  const value = raw?.trim() ?? "";
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return null;
  return value;
}

/** Keep the mailbox name from EMAIL_FROM and send on the verified mail domain. */
export function suggestionsFrom(emailFrom: string): string | null {
  const trimmed = emailFrom.trim();
  const named = /^(.*<)([^<>@\s]+)@([^<>@\s]+)(>.*)$/.exec(trimmed);
  if (named) {
    if (named[3].toLowerCase() === MAIL_DOMAIN) return trimmed;
    return `${named[1]}${named[2]}@${MAIL_DOMAIN}${named[4]}`;
  }
  const bare = /^([^@\s]+)@([^@\s]+)$/.exec(trimmed);
  if (!bare) return null;
  if (bare[2].toLowerCase() === MAIL_DOMAIN) return trimmed;
  return `${bare[1]}@${MAIL_DOMAIN}`;
}

export function cleanSuggestionMessage(value: string): string {
  return value.replace(/\u0000/g, "").replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

export function parseSuggestion(input: { type: string; message: string }):
  | { ok: true; type: SuggestionType; message: string }
  | { ok: false; error: string } {
  const type = input.type.trim().toLowerCase();
  if (!SUGGESTION_TYPES.includes(type as SuggestionType)) return { ok: false, error: SUGGESTION_ERRORS.type };
  const message = cleanSuggestionMessage(input.message);
  if (!message) return { ok: false, error: SUGGESTION_ERRORS.empty };
  if (message.length > SUGGESTION_MESSAGE_MAX) return { ok: false, error: SUGGESTION_ERRORS.long };
  return { ok: true, type: type as SuggestionType, message };
}

export function prepareSubmission(input: {
  userId: string | null;
  type: string;
  message: string;
  rateOk: boolean;
}):
  | { ok: true; userId: string; type: SuggestionType; message: string }
  | { ok: false; reason: "signed-out" | "rate" | "invalid"; error: string } {
  if (!input.userId) return { ok: false, reason: "signed-out", error: "Sign in to send a suggestion." };
  if (!input.rateOk) return { ok: false, reason: "rate", error: SUGGESTION_ERRORS.rate };
  const parsed = parseSuggestion(input);
  if (!parsed.ok) return { ok: false, reason: "invalid", error: parsed.error };
  return { ok: true, userId: input.userId, type: parsed.type, message: parsed.message };
}

export function suggestionAccess(role: SuggestionRole | null): { submit: boolean; review: boolean } {
  if (!role) return { submit: false, review: false };
  return { submit: true, review: role === "owner" };
}

export function suggestionNotice(input: { type: SuggestionType; message: string }): { subject: string; text: string } {
  const label = SUGGESTION_LABELS[input.type];
  return {
    subject: `Suggestion: ${label}`,
    text: `Someone signed in and sent a suggestion.\n\nType: ${label}\n\n${input.message}\n`,
  };
}

export async function createSuggestion(
  db: AppDatabase,
  input: { userId: string | null; type: string; message: string; rateOk: boolean },
): Promise<{ ok: true; id: string; type: SuggestionType; message: string } | { ok: false; reason: "signed-out" | "rate" | "invalid"; error: string }> {
  const prepared = prepareSubmission(input);
  if (!prepared.ok) return prepared;
  const id = crypto.randomUUID();
  await db.insert(suggestions).values({
    id,
    userId: prepared.userId,
    type: prepared.type,
    message: prepared.message,
    status: "new",
  });
  return { ok: true, id, type: prepared.type, message: prepared.message };
}

export async function listSuggestions(db: AppDatabase, role: SuggestionRole | null) {
  if (!suggestionAccess(role).review) return null;
  return db.select().from(suggestions).orderBy(desc(suggestions.createdAt), desc(suggestions.id));
}

export async function markSuggestionDone(db: AppDatabase, role: SuggestionRole | null, id: string): Promise<boolean> {
  if (!suggestionAccess(role).review) return false;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  const [row] = await db.select().from(suggestions).where(eq(suggestions.id, id)).limit(1);
  if (!row || row.status === "done") return false;
  await db.update(suggestions).set({ status: "done" }).where(eq(suggestions.id, id));
  return true;
}

export async function notifySuggestion(
  input: { id: string; type: SuggestionType; message: string; to: string | null; from: string | null },
  send: typeof sendAppEmail = sendAppEmail,
): Promise<{ sent: boolean }> {
  if (!input.to || !input.from) return { sent: false };
  const notice = suggestionNotice(input);
  try {
    const result = await send({
      to: input.to,
      from: input.from,
      subject: notice.subject,
      text: notice.text,
      idempotencyKey: `suggestion/${input.id}`,
      category: "suggestion",
    });
    if (!result.ok) console.error("Suggestion notice was not sent.");
    return { sent: result.ok };
  } catch {
    console.error("Suggestion notice was not sent.");
    return { sent: false };
  }
}

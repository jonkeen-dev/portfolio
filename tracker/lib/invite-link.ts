import { createHash, randomBytes } from "node:crypto";

import { appOrigin } from "@/lib/env";

import type { AppDatabase } from "./db";
import { verification } from "./db/schema";

export const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

/** Same SHA-256 base64url hash Better Auth stores for a magic-link token. */
export function hashMagicToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function magicLinkForToken(token: string): string {
  const url = new URL("/api/auth/magic-link/verify", appOrigin());
  url.searchParams.set("token", token);
  url.searchParams.set("callbackURL", "/setup");
  url.searchParams.set("newUserCallbackURL", "/setup");
  return url.toString();
}

export function inviteMessage(name: string, url: string): { subject: string; text: string } {
  const who = name.trim() || "Someone";
  return {
    subject: `${who} invited you to Calisthenics Tracker`,
    text: `${who} invited you to train with the same 12-week program. Tap to sign in: ${url}. The link works once and expires in 72 hours.`,
  };
}

export function publicProfileUrl(handle: string): string {
  return `${appOrigin()}/u/${handle}`;
}

/** Insert a 72-hour one-tap sign-in link. Returns the URL the invitee can open. */
export async function storeMagicLink(db: AppDatabase, email: string, name?: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const trimmed = name?.trim();
  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier: `magic-link:${hashMagicToken(token)}`,
    value: JSON.stringify({
      type: "magic-link",
      email,
      ...(trimmed ? { name: trimmed } : {}),
    }),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return magicLinkForToken(token);
}

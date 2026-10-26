import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Resend } from "resend";

import { devMailboxEnabled, env } from "@/lib/env";

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
  url: string | null;
  at: string;
};

function mailboxPath(): string {
  return path.join(process.cwd(), ".data", "mailbox.json");
}

export function readMailbox(): OutboundMail[] {
  try {
    const raw = readFileSync(mailboxPath(), "utf8");
    const parsed = JSON.parse(raw) as OutboundMail[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDevMail(message: OutboundMail): void {
  const file = mailboxPath();
  mkdirSync(path.dirname(file), { recursive: true });
  const existing = readMailbox();
  existing.push(message);
  writeFileSync(file, JSON.stringify(existing.slice(-50), null, 2));
}

export async function sendAppEmail(input: {
  to: string;
  subject: string;
  text: string;
  url?: string | null;
}): Promise<void> {
  const message: OutboundMail = {
    to: input.to,
    subject: input.subject,
    text: input.text,
    url: input.url ?? null,
    at: new Date().toISOString(),
  };
  if (env().EMAIL_TRANSPORT !== "resend") {
    if (!devMailboxEnabled()) {
      console.info(`[email:dev] ${message.subject} → ${message.to}`);
    }
    writeDevMail(message);
    return;
  }
  const key = env().RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is required when EMAIL_TRANSPORT=resend");
  const resend = new Resend(key);
  await resend.emails.send({
    from: env().EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo: env().EMAIL_REPLY_TO,
    tags: [{ name: "category", value: "auth" }],
  });
}

import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1).default("pglite:./.data/pglite"),
  BETTER_AUTH_SECRET: z.string().min(16).default("dev-only-secret-change-me"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  WEBAUTHN_RP_ID: z.string().min(1).default("localhost"),
  WEBAUTHN_RP_NAME: z.string().min(1).default("Calisthenics Tracker"),
  EMAIL_TRANSPORT: z.enum(["dev", "resend"]).default("dev"),
  EMAIL_FROM: z.string().min(3).default("Calisthenics Tracker <auth@jonkeen.dev>"),
  EMAIL_REPLY_TO: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(3).optional(),
  ),
  RESEND_API_KEY: z.string().optional(),
  ALLOWED_EMAILS: z.string().default(""),
  OWNER_EMAIL: z.string().optional(),
  MAX_USERS: z.coerce.number().int().positive().default(2),
  ALLOW_DEV_MAILBOX: z.string().optional(),
  RATE_LIMIT_DISABLED: z.string().optional(),
});

export type AppEnv = z.infer<typeof schema>;

let cached: AppEnv | null = null;

export function env(): AppEnv {
  if (cached) return cached;
  cached = schema.parse(process.env);
  return cached;
}

export function allowedEmails(): string[] {
  return env()
    .ALLOWED_EMAILS.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export function ownerEmail(): string | null {
  const explicit = env().OWNER_EMAIL?.trim().toLowerCase();
  if (explicit) return explicit;
  return allowedEmails()[0] ?? null;
}

export function isAllowedEmail(email: string): boolean {
  return allowedEmails().includes(email.trim().toLowerCase());
}

export function devMailboxEnabled(): boolean {
  if (env().EMAIL_TRANSPORT !== "dev") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production" && env().ALLOW_DEV_MAILBOX !== "1") return false;
  return true;
}

export function appOrigin(): string {
  return env().BETTER_AUTH_URL.replace(/\/$/, "");
}

export function secureCookies(): boolean {
  return appOrigin().startsWith("https://");
}

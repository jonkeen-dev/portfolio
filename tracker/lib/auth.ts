import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { and, eq, isNull, ne } from "drizzle-orm";

import { decideRegistration, NEUTRAL_AUTH_MESSAGE } from "@/lib/auth-policy";
import { createDal } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import { account, invites, passkey as passkeyTable, session as sessionTable, user, verification } from "@/lib/db/schema";
import { sendAppEmail } from "@/lib/email";
import { allowedEmails, appOrigin, env, ownerEmail, secureCookies } from "@/lib/env";
import { hashIp, uaFamily } from "@/lib/request-meta";
import { rateLimit } from "@/lib/rate-limit";

async function registrationFor(email: string) {
  const db = getDatabase().db;
  const normalized = email.trim().toLowerCase();
  const [existing] = await db.select().from(user).where(eq(user.email, normalized)).limit(1);
  const active = await db
    .select({ id: user.id })
    .from(user)
    .where(isNull(user.deactivatedAt));
  const now = new Date();
  const pending = existing
    ? []
    : await db
        .select()
        .from(invites)
        .where(and(eq(invites.email, normalized), isNull(invites.acceptedAt), isNull(invites.revokedAt)));
  const hasInvite = pending.some((invite) => invite.expiresAt > now);
  return decideRegistration({
    email: normalized,
    allowed: allowedEmails(),
    owner: ownerEmail(),
    activeUsers: active.length,
    maxUsers: env().MAX_USERS,
    hasAccount: Boolean(existing) && !existing?.deactivatedAt,
    deactivated: Boolean(existing?.deactivatedAt),
    hasInvite,
  });
}

export const auth = betterAuth({
  appName: env().WEBAUTHN_RP_NAME,
  baseURL: appOrigin(),
  secret: env().BETTER_AUTH_SECRET,
  trustedOrigins: [appOrigin()],
  database: drizzleAdapter(getDatabase().db, {
    provider: "pg",
    schema: { user, session: sessionTable, account, verification, passkey: passkeyTable },
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  advanced: {
    useSecureCookies: secureCookies(),
    cookies: {
      session_token: {
        name: secureCookies() ? "__Host-ct_session" : "ct_session",
        attributes: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: secureCookies(),
        },
      },
    },
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_DISABLED !== "1",
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/magic-link": { window: 60, max: 5 },
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "member", input: false },
      deactivatedAt: { type: "date", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (created) => {
          const decision = await registrationFor(created.email);
          if (!decision.ok) {
            throw new APIError("FORBIDDEN", { message: NEUTRAL_AUTH_MESSAGE });
          }
          return { data: { ...created, role: decision.role, email: created.email.toLowerCase() } };
        },
        after: async (created) => {
          const db = getDatabase().db;
          await db
            .update(invites)
            .set({ acceptedAt: new Date() })
            .where(and(eq(invites.email, created.email.toLowerCase()), isNull(invites.acceptedAt)));
        },
      },
    },
    session: {
      create: {
        after: async (created) => {
          const db = getDatabase().db;
          const dal = createDal(db);
          const row = created as {
            id: string;
            userId: string;
            ipAddress?: string | null;
            userAgent?: string | null;
          };
          await db
            .update(sessionTable)
            .set({ ipAddress: hashIp(row.ipAddress), userAgent: uaFamily(row.userAgent) })
            .where(eq(sessionTable.id, row.id));
          await db
            .delete(sessionTable)
            .where(and(eq(sessionTable.userId, created.userId), ne(sessionTable.id, created.id)));
          await dal.audit(created.userId, "sign_in", {
            ipHash: hashIp(row.ipAddress) ?? undefined,
            uaFamily: uaFamily(row.userAgent) ?? undefined,
          });
        },
      },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 10,
      storeToken: "hashed",
      rateLimit: {
        window: process.env.RATE_LIMIT_DISABLED === "1" ? 1 : 60,
        max: process.env.RATE_LIMIT_DISABLED === "1" ? 1000 : 5,
      },
      sendMagicLink: async ({ email, url }) => {
        const normalized = email.trim().toLowerCase();
        const decision = await registrationFor(normalized);
        const burst = rateLimit(`magic-email:${normalized}`, 10, 60 * 60 * 1000);
        if (!decision.ok || !burst.ok) return;
        await sendAppEmail({
          to: normalized,
          subject: "Your sign-in link",
          text: `Sign in to Calisthenics Tracker. This link works once and expires in 10 minutes.\n\n${url}\n\nIf you did not ask for this, you can ignore it.`,
          url,
        });
        await createDal(getDatabase().db).audit(null, "magic_link_sent");
      },
    }),
    passkey({
      rpID: env().WEBAUTHN_RP_ID,
      rpName: env().WEBAUTHN_RP_NAME,
      origin: appOrigin(),
    }),
    nextCookies(),
  ],
});

export type SessionUser = typeof auth.$Infer.Session.user;

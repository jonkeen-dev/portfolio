# Calisthenics Tracker

A private training log for the 12-week bodyweight program. It lives in this folder so the portfolio site at the repo root stays a separate Next.js app and a separate Vercel project. Production is intended for `https://tracker.jonkeen.dev`.

Nothing here is deployed by this repository. There are no live Neon, Resend, or Vercel credentials.

## Local run

Node 22. Docker is not required. Without `DATABASE_URL` starting with `postgres://` or `postgresql://`, the app uses [PGlite](https://pglite.dev/) at `.data/pglite`.

```bash
cd tracker
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000. Sign-in mail is written to `tracker/.data/mailbox.json` when `EMAIL_TRANSPORT=dev`. Put your address in `ALLOWED_EMAILS` first. The first allowlisted address (or `OWNER_EMAIL`) can create an account without an invite. Invite the second person from Settings.

Passkeys on your machine need `BETTER_AUTH_URL=http://localhost:3000` and `WEBAUTHN_RP_ID=localhost`. `127.0.0.1` will not accept a localhost relying party id.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
```

`npm run e2e` builds nothing by itself. Run `npm run build` first. Playwright then resets `.data/e2e`, seeds the reference program, and starts `next start` on `127.0.0.1:3000` with the dev mailbox enabled.

## Data

- `content/*.csv` and `content/program.json` are the program. `npm run db:setup` loads them.
- `sample_log.csv` is fixture data for the progression tests. It is not copied into user accounts.
- `drizzle/0000_init.sql` is the migration. The runner is `lib/db/migrate.ts`.
- User rows are enforced in `lib/db/access.ts`. Postgres row level security policies exist and are not forced, so the table owner used by local PGlite and by a Neon owner role is not locked out. Point production at a non-owner role if you want those policies to apply.

## Production shape

One Vercel project, root directory `tracker`, framework Next.js, no `basePath`. The portfolio project keeps its root at the repository root. Do not turn the repo into npm workspaces.

Set `DATABASE_URL` to a Neon connection string. The same Drizzle schema talks to Neon through `postgres.js` and to PGlite locally.

Auth cookies use the `__Host-ct_session` name only when `BETTER_AUTH_URL` is `https://`. Local http uses `ct_session` without `Secure` and without a `Domain`.

Leave `ALLOW_DEV_MAILBOX` and `RATE_LIMIT_DISABLED` unset in production. Set `EMAIL_TRANSPORT=resend`. In the Resend dashboard, turn off open and click tracking.

`/api/dev/mailbox` and `/api/dev/prior-session` respond 404 unless the dev mailbox is explicitly enabled and the deploy is not production.

## What is deferred

Kettlebell equipment, public signup, the onboarding quiz, a full offline sync worker, native apps, the Excel importer, a coach editor, payments, wearables, iOS VoiceOver passes, Sentry, and nightly encrypted dumps. The service worker is network-only so the app is installable. A failed save is queued in IndexedDB and retried when the browser is online again. Rate limits are in-memory (per instance), so use the Vercel firewall in front of the sign-in route as well. Charts are a text summary, a labeled bar, and a table.

## Deploy checklist

1. Create a Neon project and a production database. Copy the pooled `postgres://` connection string.
2. Create a Resend account and an API key. Verify the sending domain before inviting anyone.
3. Create a new Vercel project from this repo. Set the root directory to `tracker`. Leave the portfolio project's root directory as the repo root. Do not attach this app to the portfolio's `*.vercel.app` host.
4. Add the production environment variables below. Keep a separate Neon branch and a separate `ALLOWED_EMAILS` list for Preview. Do not point Preview at the production database.
5. Set the production branch to whatever you deploy from after this work is merged. This pull request should not auto-deploy.
6. Add the domain `tracker.jonkeen.dev` on that Vercel project and finish HTTPS there. Use that host for `BETTER_AUTH_URL`. WebAuthn will not work on a `vercel.app` host once the relying party id is `tracker.jonkeen.dev`.
7. In Cloudflare DNS for `jonkeen.dev`, add a `CNAME` named `tracker` to the target Vercel shows for the domain. Leave the cloud grey (DNS only) so Vercel can issue the certificate. The app sends HSTS with `includeSubDomains` only when `BETTER_AUTH_URL` is https. That header is on the tracker response, not a replacement for any portfolio HSTS policy.
8. Resend DNS, also in Cloudflare. If Proton already has MX, SPF, and DKIM on the root domain, send from a subdomain instead (`auth@mail.jonkeen.dev`, with Resend's return-path on its sending host). Otherwise add the records Resend shows: one SPF TXT that includes both Proton and Resend if you must share the root, Resend's DKIM next to Proton's, and a single `_dmarc.jonkeen.dev`. Copy the records from Resend's current Records tab (newer domains may be CNAMEs). Turn off open and click tracking. Set `EMAIL_REPLY_TO` only if someone should actually receive replies.
9. From a machine that has the production `DATABASE_URL`, run `npm run db:setup` once in `tracker/` before the first invite. That applies migrations and seeds the program.
10. Production env:
    - `DATABASE_URL` Neon pooled string
    - `BETTER_AUTH_SECRET` long random
    - `BETTER_AUTH_URL=https://tracker.jonkeen.dev`
    - `NEXT_PUBLIC_APP_URL=https://tracker.jonkeen.dev`
    - `WEBAUTHN_RP_ID=tracker.jonkeen.dev`
    - `WEBAUTHN_RP_NAME=Calisthenics Tracker`
    - `EMAIL_TRANSPORT=resend`
    - `RESEND_API_KEY`
    - `EMAIL_FROM=Calisthenics Tracker <auth@jonkeen.dev>` (or the subdomain address)
    - `EMAIL_REPLY_TO` optional
    - `ALLOWED_EMAILS` comma-separated, owner first or set `OWNER_EMAIL`
    - `OWNER_EMAIL`
    - `MAX_USERS=2`
    - Do not set `ALLOW_DEV_MAILBOX`, `EMAIL_TRANSPORT=dev`, or `RATE_LIMIT_DISABLED`
11. Redeploy after the env is saved. Sign in as the owner, add a passkey on Android Chrome, install the app, then send the partner invite from Settings. Confirm `/u/your-handle` sends `noindex` until you turn indexing on.
12. Optional later: a non-owner database role so the RLS policies apply, and a link from the portfolio to `https://tracker.jonkeen.dev`. Neon free-tier point-in-time recovery is short. Nightly dumps are not built.

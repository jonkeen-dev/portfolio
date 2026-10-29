import { defineConfig, devices } from "@playwright/test";

const env = {
  ...process.env,
  DATABASE_URL: "pglite:./.data/e2e",
  ALLOWED_EMAILS: "owner@example.com,partner@example.com",
  OWNER_EMAIL: "owner@example.com",
  EMAIL_TRANSPORT: "dev",
  ALLOW_DEV_MAILBOX: "1",
  RATE_LIMIT_DISABLED: "1",
  PORT: "3100",
  BETTER_AUTH_URL: "http://127.0.0.1:3100",
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3100",
  BETTER_AUTH_SECRET: "e2e-secret-at-least-32-characters",
  WEBAUTHN_RP_ID: "localhost",
  WEBAUTHN_RP_NAME: "Calisthenics Tracker",
};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: "http://127.0.0.1:3100",
    ...devices["Pixel 7"],
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run e2e:serve",
    url: "http://127.0.0.1:3100/sign-in",
    timeout: 180_000,
    reuseExistingServer: false,
    env,
  },
});

import { describe, expect, it } from "vitest";

import { decideRegistration } from "../lib/auth-policy";

const base = {
  allowed: ["owner@example.com", "partner@example.com"],
  owner: "owner@example.com",
  activeUsers: 0,
  maxUsers: 2,
  hasAccount: false,
  deactivated: false,
  hasInvite: false,
};

describe("registration policy", () => {
  it("lets the owner in and refuses everyone else with the same denial", () => {
    expect(decideRegistration({ ...base, email: "owner@example.com" }).ok).toBe(true);
    expect(decideRegistration({ ...base, email: "stranger@example.com" }).ok).toBe(false);
    expect(decideRegistration({ ...base, email: "partner@example.com" }).ok).toBe(false);
  });

  it("lets an invited partner in until the cap", () => {
    expect(decideRegistration({ ...base, email: "partner@example.com", hasInvite: true }).ok).toBe(true);
    expect(
      decideRegistration({
        ...base,
        email: "partner@example.com",
        hasInvite: true,
        activeUsers: 2,
      }).ok,
    ).toBe(false);
  });

  it("blocks a deactivated account even if they are allowlisted", () => {
    expect(
      decideRegistration({
        ...base,
        email: "owner@example.com",
        hasAccount: false,
        deactivated: true,
      }).ok,
    ).toBe(false);
  });
});

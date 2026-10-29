export type RegistrationDecision =
  | { ok: true; role: "owner" | "member" }
  | { ok: false };

/**
 * Allowlist is required for every sign-in. The owner (first allowlisted address,
 * or OWNER_EMAIL) can create the first account without an invite. Everyone else
 * needs a live invite, and new accounts stop at MAX_USERS.
 * The same denial is returned for every failure so callers can use one message.
 */
export function decideRegistration(input: {
  email: string;
  allowed: string[];
  owner: string | null;
  activeUsers: number;
  maxUsers: number;
  hasAccount: boolean;
  deactivated: boolean;
  hasInvite: boolean;
}): RegistrationDecision {
  const email = input.email.trim().toLowerCase();
  if (!input.allowed.includes(email)) return { ok: false };
  if (input.deactivated) return { ok: false };
  const role = email === input.owner ? "owner" : "member";
  if (input.hasAccount) return { ok: true, role };
  if (input.activeUsers >= input.maxUsers) return { ok: false };
  if (role === "owner" || input.hasInvite) return { ok: true, role };
  return { ok: false };
}

export const NEUTRAL_AUTH_MESSAGE =
  "Check your email. If this address has access, there's a sign-in link waiting. It works for 10 minutes.";

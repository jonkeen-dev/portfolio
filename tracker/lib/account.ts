export function deleteAccountError(confirm: string, sessionAgeMs: number): string | null {
  if (confirm !== "DELETE") return "Type DELETE to confirm.";
  if (!Number.isFinite(sessionAgeMs) || sessionAgeMs > 12 * 60 * 60 * 1000) {
    return "Sign in again first. For safety this needs a sign-in from the last 12 hours.";
  }
  return null;
}

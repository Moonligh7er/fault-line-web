// Admin allowlist. Source of truth: process.env.ADMIN_EMAILS, comma-separated.
// Empty / unset env means no admins — defense-in-depth so a misconfigured
// deploy locks itself rather than silently letting any signed-in user through.
//
// Migrate to a `profiles.role` column once we need anything more nuanced
// (per-feature permissions, multi-org scoping, etc.).

const RAW = process.env.ADMIN_EMAILS ?? '';

const ADMIN_EMAILS: ReadonlySet<string> = new Set(
  RAW.split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}

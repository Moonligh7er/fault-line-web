// User-facing error text. Raw database, Stripe or network messages can carry
// SQL, constraint names, ids or upstream details, so they are logged on the
// server and the user gets a fixed message chosen by error class.

export function userError(context: string, err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  console.error(`[${context}]`, err);
  const code = typeof err === 'object' && err !== null ? (err as { code?: unknown }).code : undefined;
  if (code === '42501') return 'You do not have permission to do that.';
  if (code === 'P0402') return 'This city account is not active.';
  if (code === '23505') return 'That already exists.';
  return fallback;
}

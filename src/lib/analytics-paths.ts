// Pages where Google Analytics must never load or send hits: signed-in
// areas, city/admin tools, sign-in flows, and the legal/insurance documents
// generated for a single report.

const PRIVATE_PREFIXES = ['/admin', '/portal', '/profile', '/dashboard', '/login', '/auth'];
const PRIVATE_REPORT_PAGE = /^\/report\/[^/]+\/(?:legal|insurance)(?:\/|$)/;

export function isAnalyticsExcluded(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  const path = pathname.toLowerCase();
  if (PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  return PRIVATE_REPORT_PAGE.test(path);
}

import type { NextRequest } from 'next/server';
import { open311Error, open311Json, open311Options, open311RateLimited, services } from '@/lib/open311';

// GET /open311/v2/services.json — report categories as Open311 services.
export async function GET(req: NextRequest) {
  if (await open311RateLimited(req.headers)) return open311Error(429, 'Rate limit exceeded');
  return open311Json(services());
}

export const OPTIONS = open311Options;

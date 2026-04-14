import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { buildCsp, generateNonce } from '@/lib/csp';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PROTECTED_PATHS = ['/dashboard', '/profile', '/submit'];
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const isDev = process.env.NODE_ENV !== 'production';
  const nonce = generateNonce();

  // --- CSRF / origin check on mutating requests ---
  if (MUTATION_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const expected = process.env.NEXT_PUBLIC_APP_ORIGIN;
    if (origin && expected) {
      try {
        const originUrl = new URL(origin);
        const expectedUrl = new URL(expected);
        if (originUrl.host !== expectedUrl.host && originUrl.host !== host) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      } catch {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  // Build headers with nonce so server components can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  const csp = buildCsp({ nonce, isDev });
  requestHeaders.set('content-security-policy', csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  response.headers.set('x-nonce', nonce);

  // --- Supabase session refresh (cookies) ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          response.headers.set('content-security-policy', csp);
          response.headers.set('x-nonce', nonce);
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: !isDev,
              sameSite: 'lax',
              path: '/',
            });
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Protected route guard ---
  if (PROTECTED_PATHS.some((p) => url.pathname.startsWith(p)) && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', url.pathname + url.search);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

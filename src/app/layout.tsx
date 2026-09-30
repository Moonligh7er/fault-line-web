import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'http://localhost:3000'),
  title: {
    default: 'Fault Line — Report Infrastructure Issues',
    template: '%s | Fault Line',
  },
  description:
    'Community infrastructure accountability. Report potholes, broken streetlights, and infrastructure issues. Free and community-verified.',
  applicationName: 'Fault Line',
  authors: [{ name: 'Michael Wylde', url: 'https://fault-line.dev' }],
  creator: 'Moonlit Social Labs',
  publisher: 'Moonlit Social Labs',
  formatDetection: { email: false, address: false, telephone: false },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Fault Line',
    title: 'Fault Line — Report Infrastructure Issues',
    description: 'Community infrastructure accountability platform.',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#1E88E5',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = Boolean(user);
  const ADMIN_EMAILS = new Set(['moonligh7er@gmail.com', 'moonlit-social-labs@proton.me']);
  const isAdmin = Boolean(user?.email && ADMIN_EMAILS.has(user.email.toLowerCase()));

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
        />
      </head>
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            Fault<span>&nbsp;Line</span>
          </Link>
          <nav aria-label="Main">
            <Link href="/map">Map</Link>
            <Link href="/search">Search</Link>
            <Link href="/submit">Report</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/authority">Authorities</Link>
            <Link href="/feedback" className="active-dev-pill" aria-label="Feedback (Beta)">
              <span className="active-dev-dot" aria-hidden="true" />
              Beta
            </Link>
            {isAdmin && <Link href="/admin/queue">Queue</Link>}
            {isSignedIn ? (
              <>
                <Link href="/profile">Profile</Link>
                <form
                  action="/auth/signout"
                  method="post"
                  style={{ display: 'inline' }}
                >
                  <button
                    type="submit"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      font: 'inherit',
                      fontWeight: 500,
                      fontSize: 14,
                      padding: 0,
                    }}
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login">Sign in</Link>
            )}
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <nav aria-label="Footer">
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/feedback">Feedback</Link>
            <a href="https://fault-line.dev" rel="noopener">Marketing site</a>
            <a href="https://fault-line.dev/methodology.html" rel="noopener">Grading methodology</a>
            <a href="https://fault-line.dev/cities.html" rel="noopener">For cities</a>
            <a href="https://fault-line.dev/faq.html" rel="noopener">FAQ</a>
            <a href="https://fault-line.dev/changelog.html" rel="noopener">Changelog</a>
          </nav>
          <p>
            &copy; 2025&ndash;{new Date().getFullYear()} Moonlit Social Labs · Fault Line is a product of Moonlit Social Labs
          </p>
        </footer>
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
              nonce={nonce}
            />
            <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { anonymize_ip: true });`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}

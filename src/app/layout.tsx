import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import Link from 'next/link';
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
  authors: [{ name: 'Fault Line' }],
  creator: 'Fault Line',
  publisher: 'Fault Line',
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

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            Fault<span>Line</span>
          </Link>
          <nav aria-label="Main">
            <Link href="/map">Map</Link>
            <Link href="/search">Search</Link>
            <Link href="/submit">Report</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/authority">Authorities</Link>
            <Link href="/profile">Profile</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <nav aria-label="Footer">
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
          <p>&copy; {new Date().getFullYear()} Fault Line</p>
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

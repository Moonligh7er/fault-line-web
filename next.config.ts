import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Supabase project host: images and CSP are pinned to it, not *.supabase.co.
const SUPABASE_HOST = 'dzewklljiksyivsfpunt.supabase.co';

// Never fall back to localhost in production: an unset origin there leaves
// only same-host server actions allowed.
const appOrigin =
  process.env.NEXT_PUBLIC_APP_ORIGIN ??
  (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000');

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
      // Hosts, not URLs: Next compares these with the Origin header's host.
      allowedOrigins: appOrigin ? [new URL(appOrigin).host] : [],
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: SUPABASE_HOST,
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },

  async headers() {
    return [
      {
        // /embed/* is framed by city websites; everything else is DENY.
        source: '/((?!embed/).*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Download-Options', value: 'noopen' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          {
            key: 'Permissions-Policy',
            value: [
              'accelerometer=()',
              'ambient-light-sensor=()',
              'autoplay=()',
              'battery=()',
              'camera=(self)',
              'display-capture=()',
              'encrypted-media=()',
              'fullscreen=(self)',
              'geolocation=(self)',
              'gyroscope=()',
              'interest-cohort=()',
              'magnetometer=()',
              'microphone=()',
              'midi=()',
              'payment=()',
              'picture-in-picture=()',
              'publickey-credentials-get=()',
              'screen-wake-lock=()',
              'sync-xhr=()',
              'usb=()',
              'web-share=(self)',
              'xr-spatial-tracking=()',
            ].join(', '),
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
      // Open311 feed is public open data: other origins (city 311 systems,
      // civic-data tools) must be able to read it. Later rules override
      // earlier ones for the same header key.
      {
        source: '/open311/:path*',
        headers: [{ key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' }],
      },
      // Keyed read API (AI agents, tools) — key-authenticated, so cross-origin is fine.
      {
        source: '/api/v1/:path*',
        headers: [{ key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' }],
      },
    ];
  },
};

// Wrap with Sentry only when the auth token is present (prevents noisy
// build warnings in local dev). Runtime Sentry initialization happens
// via `instrumentation.ts` regardless.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(config, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      tunnelRoute: '/monitoring',
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : config;

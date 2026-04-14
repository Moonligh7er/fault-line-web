export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Base64 encode without Buffer (Edge Runtime has no Node Buffer)
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

interface BuildCspOptions {
  nonce: string;
  isDev: boolean;
}

/**
 * Build a strict CSP. No unsafe-inline, no unsafe-eval (dev needs unsafe-eval
 * for React Fast Refresh). Scripts use per-request nonces.
 */
export function buildCsp({ nonce, isDev }: BuildCspOptions): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // GA4
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ];

  if (isDev) {
    // Next.js dev overlay needs eval for Fast Refresh
    scriptSrc.push("'unsafe-eval'");
  }

  const connectSrc = [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://www.google-analytics.com',
    'https://analytics.google.com',
  ];

  if (isDev) {
    connectSrc.push('ws://localhost:*', 'http://localhost:*');
  }

  const policy = [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `script-src-elem ${scriptSrc.join(' ')}`,
    `style-src 'self' 'unsafe-inline' https://unpkg.com`, // Leaflet CSS from CDN
    `img-src 'self' data: blob: https://*.supabase.co https://*.tile.openstreetmap.org https://unpkg.com`,
    `font-src 'self' data:`,
    `connect-src ${connectSrc.join(' ')}`,
    `media-src 'self' blob: https://*.supabase.co`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `frame-src 'none'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `upgrade-insecure-requests`,
  ];

  return policy.join('; ');
}

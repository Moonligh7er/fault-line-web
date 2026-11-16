'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { isAnalyticsExcluded } from '@/lib/analytics-paths';

interface Props {
  gaId: string;
  nonce?: string;
}

// GA4, kept off private pages (see analytics-paths). The script is only
// rendered on public pages; once it has loaded, client-side navigation into
// a private page sets GA's own opt-out flag (`ga-disable-<id>`) so no hit,
// including the automatic history page_view, is sent from there.
export default function Analytics({ gaId, nonce }: Props) {
  const pathname = usePathname();
  const excluded = isAnalyticsExcluded(pathname);

  // Set during render too: Next pushes the new URL (which GA turns into a
  // page_view) before effects run.
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = excluded;
  }
  useEffect(() => {
    (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = excluded;
  }, [gaId, excluded]);

  if (excluded) return null;
  return (
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
gtag('config', ${JSON.stringify(gaId)}, { anonymize_ip: true });`}
      </Script>
    </>
  );
}

'use client';

import { useState } from 'react';

interface Props {
  url: string;
  title: string;
}

export default function ShareButton({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    // Only use Web Share API if available; never fall back to window.open
    // with untrusted URLs.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ url, title });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* permission denied */
    }
  }

  return (
    <button type="button" className="btn btn-outline" onClick={share}>
      {copied ? '✓ Link copied' : 'Share'}
    </button>
  );
}

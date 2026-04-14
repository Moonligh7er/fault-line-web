'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Never log raw error.message to the user — only the digest.
    // Sentry will capture details via its Next.js integration.
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>Something went wrong</h1>
      <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>
        The error has been logged. Please try again.
      </p>
      {error.digest && (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 24 }}>
          Error ref: <code>{error.digest}</code>
        </p>
      )}
      <button className="btn btn-primary" onClick={reset} type="button">
        Try again
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { ClaimEvidence } from '@/lib/insurance';

export default function ClaimView({ claim }: { claim: ClaimEvidence }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(claim.fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* permission denied */
    }
  }

  function download() {
    const blob = new Blob([claim.fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claim-${claim.reportId.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-outline" onClick={copy} type="button">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <button className="btn btn-outline" onClick={download} type="button">
          Download .txt
        </button>
      </div>
      <pre
        className="card"
        style={{
          whiteSpace: 'pre-wrap',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          maxHeight: '70vh',
          overflow: 'auto',
        }}
      >
        {claim.fullText}
      </pre>
    </div>
  );
}

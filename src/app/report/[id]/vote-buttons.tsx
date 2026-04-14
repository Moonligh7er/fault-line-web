'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { submitVote } from './actions';

interface Props {
  reportId: string;
  isSignedIn: boolean;
  isOwner: boolean;
}

export default function VoteButtons({ reportId, isSignedIn, isOwner }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  );

  if (!isSignedIn) {
    return (
      <Link
        href={`/login?next=/report/${reportId}`}
        className="btn btn-outline"
      >
        Sign in to vote
      </Link>
    );
  }

  if (isOwner) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        You can&apos;t vote on your own report
      </p>
    );
  }

  function cast(voteType: 'upvote' | 'confirm') {
    startTransition(async () => {
      const res = await submitVote({ reportId, voteType });
      setMessage({ kind: res.ok ? 'ok' : 'err', text: res.message });
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-outline"
          disabled={pending}
          onClick={() => cast('upvote')}
          type="button"
        >
          ▲ Upvote
        </button>
        <button
          className="btn btn-outline"
          disabled={pending}
          onClick={() => cast('confirm')}
          type="button"
        >
          ✓ Confirm
        </button>
      </div>
      {message && (
        <p className={message.kind === 'ok' ? 'success' : 'error'}>{message.text}</p>
      )}
    </div>
  );
}
